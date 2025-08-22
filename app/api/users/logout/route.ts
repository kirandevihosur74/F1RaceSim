import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client with better error handling
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in logout API')
    throw new Error('AWS credentials not configured for logout tracking')
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

// Use the existing table from your infrastructure
const METADATA_TABLE = process.env.METADATA_TABLE || 'f1-strategy-metadata-dev'

export async function POST(request: NextRequest) {
  try {
    console.log('Logout API called with request:', request.url)
    const { userId, logoutTime } = await request.json()
    console.log('Logout data received:', { userId, logoutTime })
    
    if (!userId) {
      console.log('No userId provided in logout request')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Find the user profile
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

    const result = await getDocClient().send(queryCommand)
    
    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const userProfile = result.Items[0]
    
    // Update user profile with logout information
    const updatedProfile = {
      ...userProfile,
      lastLogout: logoutTime,
      status: 'inactive',
      updatedAt: new Date().toISOString(),
    }

    const putCommand = new PutCommand({
      TableName: METADATA_TABLE,
      Item: updatedProfile,
    })

    await getDocClient().send(putCommand)

    // Also create a logout event record
    const logoutEvent = {
      strategy_id: `USER_${userId}_LOGOUT_${Date.now()}`,
      user_id: userId,
      type: 'USER_LOGOUT',
      logout_time: logoutTime,
      created_at: new Date().toISOString(),
      session_duration: userProfile.lastSignIn ? 
        new Date(logoutTime).getTime() - new Date(userProfile.lastSignIn).getTime() : 
        null,
    }

    const logoutPutCommand = new PutCommand({
      TableName: METADATA_TABLE,
      Item: logoutEvent,
    })

    await getDocClient().send(logoutPutCommand)

    return NextResponse.json({
      message: 'Logout tracked successfully',
      user: updatedProfile,
    })

  } catch (error) {
    console.error('Error tracking logout:', error)
    return NextResponse.json(
      { error: 'Failed to track logout' },
      { status: 500 }
    )
  }
}
