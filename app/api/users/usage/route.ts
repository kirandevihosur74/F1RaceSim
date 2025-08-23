import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { getCurrentUserPlan } from '../../../../lib/pricing'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    console.error('AWS credentials missing in usage API')
    throw new Error('AWS credentials not configured for usage tracking')
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

// Helper functions for usage management
const getUsageKey = (userId: string, feature: string, date: string) => {
  return `USER_${userId}_USAGE_${feature}_${date}`
}

const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0] // YYYY-MM-DD format
}

const getFeatureLimit = (plan: any, feature: string): number => {
  switch (feature) {
    case 'simulations':
      return plan.limits.simulationsPerDay
    case 'strategies':
      return plan.limits.strategies
    case 'ai_recommendations':
      return plan.id === 'free' ? 1 : -1 // Free: 1, Pro+: unlimited
    default:
      return 0
  }
}

const getResetDate = (feature: string): Date => {
  const now = new Date()
  
  if (feature === 'simulations') {
    // Reset daily at midnight
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else {
    // Reset monthly on the 1st
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId') || 'free'
    
    const plan = getCurrentUserPlan(planId)
    const features = ['simulations', 'strategies', 'ai_recommendations']
    const currentDate = getCurrentDate()
    const usageSummary = []

    for (const feature of features) {
      try {
        // Query usage for this feature and date
        const usageKey = getUsageKey(userId, feature, currentDate)
        const getCommand = new GetCommand({
          TableName: METADATA_TABLE,
          Key: { strategy_id: usageKey }
        })
        
        const result = await getDocClient().send(getCommand)
        const current = result.Item?.current_count || 0
        const limit = getFeatureLimit(plan, feature)
        const resetDate = getResetDate(feature)

        usageSummary.push({
          feature,
          current,
          limit,
          resetDate,
          isUnlimited: limit === -1
        })
      } catch (error) {
        console.error(`Error fetching usage for ${feature}:`, error)
        // Add default entry if query fails
        const limit = getFeatureLimit(plan, feature)
        usageSummary.push({
          feature,
          current: 0,
          limit,
          resetDate: getResetDate(feature),
          isUnlimited: limit === -1
        })
      }
    }
    
    return NextResponse.json({ usage: usageSummary })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feature, planId = 'free' } = await request.json()
    const userId = session.user.id

    if (!feature) {
      return NextResponse.json({ error: 'Feature is required' }, { status: 400 })
    }

    const plan = getCurrentUserPlan(planId)
    const limit = getFeatureLimit(plan, feature)
    const currentDate = getCurrentDate()
    const usageKey = getUsageKey(userId, feature, currentDate)

    // Get current usage
    let currentUsage = 0
    try {
      const getCommand = new GetCommand({
        TableName: METADATA_TABLE,
        Key: { strategy_id: usageKey }
      })
      
      const result = await getDocClient().send(getCommand)
      currentUsage = result.Item?.current_count || 0
    } catch (error) {
      // No existing usage record, start at 0
      currentUsage = 0
    }

    // Check if user can perform the action
    const allowed = limit === -1 || currentUsage < limit
    
    if (!allowed) {
      const resetDate = getResetDate(feature)
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        details: {
          allowed: false,
          current: currentUsage,
          limit,
          remaining: 0,
          resetDate,
          message: `Limit reached. Resets on ${resetDate.toLocaleDateString()}`
        }
      }, { status: 429 })
    }

    // Increment usage
    const newUsage = currentUsage + 1
    const putCommand = new PutCommand({
      TableName: METADATA_TABLE,
      Item: {
        strategy_id: usageKey,
        user_id: userId,
        type: 'USER_USAGE',
        feature,
        current_count: newUsage,
        limit,
        date: currentDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    await getDocClient().send(putCommand)
    
    const resetDate = getResetDate(feature)
    return NextResponse.json({ 
      success: true, 
      usage: {
        allowed: true,
        current: newUsage,
        limit,
        remaining: Math.max(0, limit - newUsage),
        resetDate
      },
      message: `Usage tracked for ${feature}`
    })
  } catch (error) {
    console.error('Error tracking usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
