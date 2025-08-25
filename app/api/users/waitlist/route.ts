import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { dynamoDb, TABLES } from '../../../../lib/dynamodb'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

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

    // Create or update user profile with waitlist status
    const updateCommand = new UpdateCommand({
      TableName: metadataTable,
      Key: {
        strategy_id: `USER_${userId}_PROFILE`,
        type: 'USER_PROFILE'
      },
      UpdateExpression: 'SET waitlist_status = :plan, updated_at = :timestamp',
      ExpressionAttributeValues: {
        ':plan': plan,
        ':timestamp': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    })

    const result = await dynamoDb.send(updateCommand)
    
    return NextResponse.json({ 
      success: true, 
      message: `Added to ${plan} waitlist`,
      user: result.Attributes 
    })

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
      // Check if user is already on waitlist
      const { scanTable } = await import('../../../../lib/dynamodb')
      const allItems = await scanTable(metadataTable)
      
      const userProfile = allItems.find((item: any) => 
        item.strategy_id === `USER_${userId}_PROFILE` && 
        item.type === 'USER_PROFILE'
      )
      
      return NextResponse.json({ 
        onWaitlist: !!userProfile?.waitlist_status,
        plan: userProfile?.waitlist_status || null
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error checking waitlist status:', error)
    return NextResponse.json({ error: 'Failed to check waitlist status' }, { status: 500 })
  }
}
