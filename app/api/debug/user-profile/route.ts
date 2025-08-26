import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { safeDynamoDB, TABLES } from '../../../../lib/dynamodb-safe'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.email
    const metadataTable = TABLES.STRATEGY_METADATA

    console.log('Debug: Looking for user profile for:', userId)

    // Scan for user profile
    const scanResult = await safeDynamoDB.scan({
      TableName: metadataTable,
      FilterExpression: 'contains(strategy_id, :userId) AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':type': 'USER_PROFILE'
      }
    }, 'debug-user-profile')

    console.log('Debug: Scan result:', scanResult)

    // Also scan for any items containing this user ID
    const allItemsResult = await safeDynamoDB.scan({
      TableName: metadataTable,
      FilterExpression: 'contains(strategy_id, :userId)',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }, 'debug-all-items')

    console.log('Debug: All items containing user ID:', allItemsResult)

    return NextResponse.json({ 
      userId,
      userProfile: scanResult.Items?.[0] || null,
      allUserItems: allItemsResult.Items || [],
      scanResult,
      allItemsResult
    })

  } catch (error) {
    console.error('Debug: Error checking user profile:', error)
    return NextResponse.json({ error: 'Failed to check user profile', details: error }, { status: 500 })
  }
}
