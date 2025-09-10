import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client with better error handling
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in waitlist API')
    throw new Error('AWS credentials not configured for waitlist functionality')
  }

  return new DynamoDBClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

let docClient: DynamoDBDocumentClient | null = null

const getDocClient = () => {
  if (!docClient) {
    const client = createDynamoDBClient()
    docClient = DynamoDBDocumentClient.from(client)
  }
  return docClient
}

const METADATA_TABLE = process.env.METADATA_TABLE || 'f1-strategy-metadata-dev'

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
    console.log('Waitlist POST: Processing request for user:', userId, 'plan:', plan)

    // Test DynamoDB client initialization early
    try {
      getDocClient()
    } catch (clientError) {
      console.error('DynamoDB client initialization failed:', clientError)
      return NextResponse.json({ 
        error: 'Database connection failed. Please try again later.' 
      }, { status: 503 })
    }

    // Use the same approach as user store API to find existing users
    let existingProfile = null
    
    try {
      // Query using UserIdIndex to find existing user profile
      const queryCommand = new QueryCommand({
        TableName: METADATA_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: 'strategy_id = :profileId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':profileId': `USER_${userId}_PROFILE`,
        },
      })
      
      const existingUser = await getDocClient().send(queryCommand)
      
      if (existingUser.Items && existingUser.Items.length > 0) {
        existingProfile = existingUser.Items[0]
        console.log('Waitlist POST: Found existing profile:', existingProfile)
      }
    } catch (queryError) {
      console.log('Could not query existing user, proceeding with creation:', queryError)
      // Continue to create new profile if query fails
    }

    if (existingProfile) {
      // Update existing profile
      console.log('Waitlist POST: Updating existing profile')
      
      const updateCommand = new UpdateCommand({
        TableName: METADATA_TABLE,
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
      })
      
      const result = await getDocClient().send(updateCommand)
      
      return NextResponse.json({ 
        success: true, 
        message: `Added to ${plan} waitlist`,
        user: result.Attributes || { waitlist_status: plan, updated_at: new Date().toISOString() }
      })
    } else {
      // Create new user profile with waitlist status
      console.log('Waitlist POST: Creating new user profile')
      
      const newProfile = {
        strategy_id: `USER_${userId}_PROFILE`,
        type: 'USER_PROFILE',
        user_id: userId,
        email: userId,
        name: session.user.name || 'Unknown User',
        waitlist_status: plan,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      }
      
      const putCommand = new PutCommand({
        TableName: METADATA_TABLE,
        Item: newProfile
      })
      
      await getDocClient().send(putCommand)
      
      return NextResponse.json({ 
        success: true, 
        message: `Added to ${plan} waitlist`,
        user: newProfile
      })
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
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'check') {
      try {
        // Use the same approach as user store API
        const queryCommand = new QueryCommand({
          TableName: METADATA_TABLE,
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'user_id = :userId',
          FilterExpression: 'strategy_id = :profileId',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':profileId': `USER_${userId}_PROFILE`,
          },
        })
        
        const existingUser = await getDocClient().send(queryCommand)
        const userProfile = existingUser.Items?.[0]
        
        return NextResponse.json({ 
          onWaitlist: !!userProfile?.waitlist_status,
          plan: userProfile?.waitlist_status || null
        })
      } catch (error) {
        console.error('Error getting user profile:', error)
        
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
