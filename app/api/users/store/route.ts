import { NextRequest, NextResponse } from 'next/server'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client with better error handling
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in user store API')
    throw new Error('AWS credentials not configured for user storage')
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
    const userData = await request.json()
    
    // Validate required fields
    if (!userData.id || !userData.email) {
      return NextResponse.json(
        { error: 'Missing required fields: id and email' },
        { status: 400 }
      )
    }

    // Check if user already exists by querying the UserIdIndex
    try {
      const queryCommand = new QueryCommand({
        TableName: METADATA_TABLE,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: 'begins_with(strategy_id, :userPrefix)',
        ExpressionAttributeValues: {
          ':userId': userData.id,
          ':userPrefix': `USER_${userData.id}`,
        },
      })
      
      const existingUser = await getDocClient().send(queryCommand)
      
      if (existingUser.Items && existingUser.Items.length > 0) {
        // Update existing user profile
        const userProfile = existingUser.Items.find(item => 
          item.strategy_id === `USER_${userData.id}_PROFILE`
        )
        
        if (userProfile) {
          const updateData = {
            ...userProfile,
            email: userData.email,
            name: userData.name,
            image: userData.image,
            provider: userData.provider,
            providerId: userData.providerId,
            lastSignIn: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active', // Set status to active on sign-in
            lastLogout: undefined, // Clear logout timestamp on sign-in
          }
          
          const putCommand = new PutCommand({
            TableName: METADATA_TABLE,
            Item: updateData,
          })
          
          await getDocClient().send(putCommand)
          
          return NextResponse.json({
            message: 'User updated successfully',
            user: updateData,
          })
        }
      }
    } catch (error) {
      console.log('Could not check existing user, proceeding with creation:', error)
    }

    // Create new user profile
    const userProfileId = `USER_${userData.id}_PROFILE`
    const newUserProfile = {
      strategy_id: userProfileId,
      user_id: userData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: 'USER_PROFILE',
      email: userData.email,
      name: userData.name,
      image: userData.image,
      provider: userData.provider,
      providerId: userData.providerId,
      createdAt: new Date().toISOString(),
      lastSignIn: new Date().toISOString(),
      status: 'active', // Set initial status
      preferences: {
        theme: 'light',
        defaultTrack: null,
        notifications: true,
      },
    }

    const putCommand = new PutCommand({
      TableName: METADATA_TABLE,
      Item: newUserProfile,
    })

    await getDocClient().send(putCommand)

    return NextResponse.json({
      message: 'User created successfully',
      user: newUserProfile,
    })

  } catch (error) {
    console.error('Error storing user in DynamoDB:', error)
    return NextResponse.json(
      { error: 'Failed to store user data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Query user profile using the UserIdIndex
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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: result.Items[0],
    })

  } catch (error) {
    console.error('Error retrieving user from DynamoDB:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve user data' },
      { status: 500 }
    )
  }
}
