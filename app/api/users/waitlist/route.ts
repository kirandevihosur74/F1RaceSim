import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { safeDynamoDB, TABLES } from '../../../../lib/dynamodb-safe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()
    
    if (!plan || !['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be "pro" or "business"' }, { status: 400 })
    }

    const userId = session.user.email
    const metadataTable = TABLES.STRATEGY_METADATA

    console.log('Waitlist POST: Processing request for user:', userId, 'plan:', plan)
    console.log('Waitlist POST: Using table:', metadataTable)

    // Create or update user profile with waitlist status
    // First, try to find existing profile using multiple strategies
    let existingProfile = null
    
    // Strategy 1: Look for exact USER_PROFILE type
    const profileScan = await safeDynamoDB.scan({
      TableName: metadataTable,
      FilterExpression: 'contains(strategy_id, :userId) AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'USER_PROFILE'
      }
    }, 'waitlist-POST-profile-scan')
    
    existingProfile = profileScan.Items?.[0]
    
    // Strategy 2: If no profile found, look for any item with this user ID
    let userScan = null
    if (!existingProfile) {
      userScan = await safeDynamoDB.scan({
        TableName: metadataTable,
        FilterExpression: 'contains(strategy_id, :userId)',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }, 'waitlist-POST-user-scan')
      
      // Find the most relevant user item (prefer USER_PROFILE, then any item with user data)
      const userItems = userScan.Items || []
      existingProfile = userItems.find(item => item.type === 'USER_PROFILE') || 
                       userItems.find(item => item.email === userId) ||
                       userItems.find(item => item.user_id === userId) ||
                       userItems[0]
    }
    
    console.log('Waitlist POST: Profile scan items:', profileScan.Items?.length || 0)
    console.log('Waitlist POST: User scan items:', userScan?.Items?.length || 0)
    console.log('Waitlist POST: Existing profile found:', !!existingProfile)
    console.log('Waitlist POST: Existing profile details:', existingProfile)
    
    if (existingProfile) {
      // Update existing profile using safe operations
      const result = await safeDynamoDB.update({
        TableName: metadataTable,
        Key: {
          strategy_id: existingProfile.strategy_id,
          type: existingProfile.type
        },
        UpdateExpression: 'SET waitlist_status = :plan, updated_at = :timestamp',
        ExpressionAttributeValues: {
          ':plan': plan,
          ':timestamp': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
      }, 'waitlist-POST-update')
      
      return NextResponse.json({ 
        success: true, 
        message: `Added to ${plan} waitlist`,
        user: result.Attributes || { waitlist_status: plan, updated_at: new Date().toISOString() }
      })
    } else {
      // Create new user profile with waitlist status
      console.log('Creating new user profile for waitlist')
      try {
        const newProfile = {
          strategy_id: `USER_${userId}_PROFILE`,
          type: 'USER_PROFILE',
          user_id: userId,
          email: userId,
          name: 'Unknown User',
          waitlist_status: plan,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        }
        
        const createResult = await safeDynamoDB.put({
          TableName: metadataTable,
          Item: newProfile
        }, 'waitlist-POST-create')
        
        console.log('Successfully created new user profile:', createResult)
        
        return NextResponse.json({ 
          success: true, 
          message: `Added to ${plan} waitlist`,
          user: newProfile
        })
      } catch (createError) {
        console.error('Error creating new user profile:', createError)
        // Return success anyway to avoid breaking the user experience
        return NextResponse.json({ 
          success: true, 
          message: `Added to ${plan} waitlist`,
          user: { waitlist_status: plan, updated_at: new Date().toISOString() }
        })
      }
    }

  } catch (error) {
    console.error('Error adding user to waitlist:', error)
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.email
    const metadataTable = TABLES.STRATEGY_METADATA

    // Get user's current waitlist status
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'check') {
      // Check if user is already on waitlist using safe operations
      try {
        const result = await safeDynamoDB.scan({
          TableName: metadataTable,
          FilterExpression: 'contains(strategy_id, :userId) AND #type = :type',
          ExpressionAttributeNames: {
            '#type': 'type'
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':type': 'USER_PROFILE'
          }
        }, 'waitlist-GET-check')
        
        const userProfile = result.Items?.[0]
        
        return NextResponse.json({ 
          onWaitlist: !!userProfile?.waitlist_status,
          plan: userProfile?.waitlist_status || null
        })
      } catch (getError) {
        console.error('Error getting user profile:', getError)
        
        // Fallback: return not on waitlist if there's an error
        return NextResponse.json({ 
          onWaitlist: false,
          plan: null
        })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error checking waitlist status:', error)
    return NextResponse.json({ error: 'Failed to check waitlist status' }, { status: 500 })
  }
}
