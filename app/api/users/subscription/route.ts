import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in subscription API')
    throw new Error('AWS credentials not configured for subscription management')
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

// Use the dedicated subscription table
const USER_SUBSCRIPTIONS_TABLE = (process.env.USER_SUBSCRIPTIONS_TABLE || 'f1-user-subscriptions-dev').trim()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    try {
      // Query for user's current subscription
      const queryCommand = new QueryCommand({
        TableName: USER_SUBSCRIPTIONS_TABLE,
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': 'active'
        },
        ScanIndexForward: false, // Get most recent first
        Limit: 1
      })
      
      const result = await getDocClient().send(queryCommand)
      
      if (result.Items && result.Items.length > 0) {
        const subscription = result.Items[0]
        return NextResponse.json({ 
          subscription: {
            id: subscription.subscription_id,
            userId: subscription.user_id,
            planId: subscription.plan_id,
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            subscriptionId: subscription.stripe_subscription_id
          }
        })
      }
    } catch (error) {
      console.log('Could not fetch subscription from database, returning default:', error)
    }
    
    // Return default free plan if no subscription found
    const subscription = {
      id: 'default',
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: null,
      subscriptionId: null
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()
    const userId = session.user.id

    if (!planId || !['free', 'pro', 'business'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 })
    }

    // Generate subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const currentPeriodStart = now.toISOString()
    
    // Calculate period end (30 days from now for paid plans)
    let currentPeriodEnd = null
    if (planId !== 'free') {
      const periodEnd = new Date(now)
      periodEnd.setDate(periodEnd.getDate() + 30)
      currentPeriodEnd = periodEnd.toISOString()
    }

    // Create new subscription record
    const subscriptionData = {
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: planId,
      status: 'active',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      stripe_subscription_id: null, // Will be set when integrated with Stripe
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }

    const putCommand = new PutCommand({
      TableName: USER_SUBSCRIPTIONS_TABLE,
      Item: subscriptionData
    })

    await getDocClient().send(putCommand)

    return NextResponse.json({ 
      subscription: {
        id: subscriptionId,
        userId,
        planId,
        status: 'active',
        currentPeriodStart,
        currentPeriodEnd,
        subscriptionId: null
      }
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
