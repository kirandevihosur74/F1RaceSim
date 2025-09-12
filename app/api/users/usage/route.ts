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

// Use the dedicated usage tracking table
const USER_USAGE_TABLE = (process.env.USER_USAGE_TABLE || 'f1-user-usage-dev').trim()

// Log table configuration for debugging
console.log('Usage API - Table configuration:', {
  USER_USAGE_TABLE,
  AWS_REGION: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
})

// Helper functions for usage management
const getFeatureDateKey = (feature: string, date: string) => {
  // Validate inputs
  if (!feature || typeof feature !== 'string' || feature.trim().length === 0) {
    throw new Error('Invalid feature provided to getFeatureDateKey')
  }
  if (!date || typeof date !== 'string' || date.trim().length === 0) {
    throw new Error('Invalid date provided to getFeatureDateKey')
  }
  
  return `${feature.trim()}_${date.trim()}`
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
    console.log('Usage API GET request received')
    
    const session = await getServerSession(authOptions)
    console.log('Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id) {
      console.log('No valid session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    console.log('Processing usage request for userId:', userId)
    
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.error('Invalid userId in session:', userId)
      return NextResponse.json({ error: 'Invalid user session' }, { status: 400 })
    }
    
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId') || 'free'
    const requestedFeature = searchParams.get('feature')
    
    // Validate requested feature if specified
    const validFeatures = ['simulations', 'strategies', 'ai_recommendations']
    if (requestedFeature && !validFeatures.includes(requestedFeature)) {
      return NextResponse.json({ error: 'Invalid feature specified' }, { status: 400 })
    }
    
    const plan = getCurrentUserPlan(planId)
    const features = requestedFeature ? [requestedFeature] : validFeatures
    const currentDate = getCurrentDate()
    const usageSummary = []

    for (const feature of features) {
      let featureDateKey: string = 'unknown'
      try {
        // Query usage for this feature and date
        try {
          featureDateKey = getFeatureDateKey(feature, currentDate)
        } catch (keyError) {
          console.error(`Error generating feature date key for ${feature}:`, keyError)
          // Skip this feature if we can't generate a valid key
          continue
        }
        
        const getCommand = new GetCommand({
          TableName: USER_USAGE_TABLE,
          Key: { 
            user_id: userId,
            feature_date_key: featureDateKey
          }
        })
        
        console.log('Usage API GET - DynamoDB query:', {
          table: USER_USAGE_TABLE,
          key: { user_id: userId, feature_date_key: featureDateKey }
        })
        
        const result = await getDocClient().send(getCommand)
        const current = result.Item?.usage_count || 0
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
        console.error(`Error fetching usage for ${feature}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          table: USER_USAGE_TABLE,
          userId,
          featureDateKey
        })
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
    console.error('Error fetching usage:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feature, planId = 'free' } = await request.json()
    const userId = session.user.id

    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.error('Invalid userId in session:', userId)
      return NextResponse.json({ error: 'Invalid user session' }, { status: 400 })
    }

    if (!feature) {
      return NextResponse.json({ error: 'Feature is required' }, { status: 400 })
    }

    const plan = getCurrentUserPlan(planId)
    const limit = getFeatureLimit(plan, feature)
    const currentDate = getCurrentDate()
    
    let featureDateKey: string
    try {
      featureDateKey = getFeatureDateKey(feature, currentDate)
    } catch (keyError) {
      console.error('Error generating feature date key:', keyError)
      return NextResponse.json({ error: 'Invalid feature date key generation' }, { status: 400 })
    }

    // Get current usage
    let currentUsage = 0
    try {
      const getCommand = new GetCommand({
        TableName: USER_USAGE_TABLE,
        Key: { 
          user_id: userId,
          feature_date_key: featureDateKey
        }
      })
      
      console.log('Usage API POST - DynamoDB get query:', {
        table: USER_USAGE_TABLE,
        key: { user_id: userId, feature_date_key: featureDateKey }
      })
      
      const result = await getDocClient().send(getCommand)
      currentUsage = result.Item?.usage_count || 0
    } catch (error) {
      console.error('Error getting current usage:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        table: USER_USAGE_TABLE,
        userId,
        featureDateKey
      })
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
      TableName: USER_USAGE_TABLE,
      Item: {
        user_id: userId,
        feature_date_key: featureDateKey,
        feature_name: feature,
        usage_count: newUsage,
        reset_date: getResetDate(feature).toISOString().split('T')[0],
        limit_value: limit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    console.log('Usage API POST - DynamoDB put command:', {
      table: USER_USAGE_TABLE,
      item: {
        user_id: userId,
        feature_date_key: featureDateKey,
        feature_name: feature,
        usage_count: newUsage,
        reset_date: getResetDate(feature).toISOString().split('T')[0],
        limit_value: limit,
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
    console.error('Error tracking usage:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      table: USER_USAGE_TABLE,
      userId: session?.user?.id || 'unknown',
      feature: 'unknown',
      featureDateKey: 'unknown'
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
