import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { getCurrentUserPlan } from './pricing'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { NextRequest } from 'next/server'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Initialize DynamoDB client
const createDynamoDBClient = () => {
  const region = process.env.AWS_REGION || 'us-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not configured for plan security')
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

// Multi-table configuration
const METADATA_TABLE = process.env.METADATA_TABLE || 'f1-strategy-metadata-dev'
const USER_SUBSCRIPTIONS_TABLE = process.env.USER_SUBSCRIPTIONS_TABLE || 'f1-user-subscriptions-dev'
const USER_USAGE_TABLE = process.env.USER_USAGE_TABLE || 'f1-user-usage-dev'
const USER_ACTIONS_LOG_TABLE = process.env.USER_ACTIONS_LOG_TABLE || 'f1-user-actions-log-dev'

export interface PlanValidationResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetDate: Date
  message?: string
  planId: string
  feature: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  message?: string
}

/**
 * Get user's actual plan from database
 */
export async function getUserPlan(userId: string): Promise<string> {
  try {
    // First try to get from subscription table
    const { QueryCommand } = await import('@aws-sdk/lib-dynamodb')
    
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
      return result.Items[0].plan_id
    }
    
    // Fallback to metadata table for backward compatibility
    const getCommand = new GetCommand({
      TableName: METADATA_TABLE,
      Key: {
        strategy_id: `USER_${userId}_PROFILE`
      }
    })
    
    const fallbackResult = await getDocClient().send(getCommand)
    const userProfile = fallbackResult.Item
    
    // Check for waitlist status or actual plan
    if (userProfile?.waitlist_status) {
      return userProfile.waitlist_status // waitlist_pro, waitlist_business
    }
    
    if (userProfile?.plan) {
      return userProfile.plan
    }
    
    // Default to free plan
    return 'free'
  } catch (error) {
    console.error('Error getting user plan:', error)
    return 'free' // Default to free plan on error
  }
}

/**
 * Get current usage for a feature
 */
export async function getCurrentUsage(userId: string, feature: string): Promise<number> {
  try {
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const featureDateKey = `${feature}_${currentDate}`
    
    const getCommand = new GetCommand({
      TableName: USER_USAGE_TABLE,
      Key: { 
        user_id: userId,
        feature_date_key: featureDateKey
      }
    })
    
    const result = await getDocClient().send(getCommand)
    return result.Item?.usage_count || 0
  } catch (error) {
    console.error('Error getting current usage:', error)
    return 0
  }
}

/**
 * Increment usage for a feature
 */
export async function incrementUsage(userId: string, feature: string): Promise<void> {
  try {
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const featureDateKey = `${feature}_${currentDate}`
    
    const currentUsage = await getCurrentUsage(userId, feature)
    
    // Get user plan to determine limit
    const userPlan = await getUserPlan(userId)
    const plan = getCurrentUserPlan(userPlan)
    const limit = getFeatureLimit(userPlan, feature)
    
    const putCommand = new PutCommand({
      TableName: USER_USAGE_TABLE,
      Item: {
        user_id: userId,
        feature_date_key: featureDateKey,
        feature_name: feature,
        usage_count: currentUsage + 1,
        reset_date: getResetDate(feature).toISOString().split('T')[0],
        limit_value: limit,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
    
    await getDocClient().send(putCommand)
  } catch (error) {
    console.error('Error incrementing usage:', error)
    throw error
  }
}

/**
 * Get feature limit based on plan
 */
export function getFeatureLimit(planId: string, feature: string): number {
  const plan = getCurrentUserPlan(planId)
  
  switch (feature) {
    case 'simulations':
      return plan.limits.simulationsPerDay
    case 'strategies':
      return plan.limits.strategies
    case 'ai_recommendations':
      return planId === 'free' ? 1 : -1 // Free: 1, Pro+: unlimited
    default:
      return 0
  }
}

/**
 * Get reset date for a feature
 */
export function getResetDate(feature: string): Date {
  const now = new Date()
  
  switch (feature) {
    case 'simulations':
    case 'ai_recommendations':
      // Daily reset
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      return tomorrow
    case 'strategies':
      // Monthly reset
      const nextMonth = new Date(now)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      nextMonth.setDate(1)
      nextMonth.setHours(0, 0, 0, 0)
      return nextMonth
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}

/**
 * Validate if user can perform an action
 */
export async function validatePlanAccess(
  userId: string, 
  feature: string
): Promise<PlanValidationResult> {
  try {
    // Get user's actual plan
    const userPlan = await getUserPlan(userId)
    const plan = getCurrentUserPlan(userPlan)
    
    // Get feature limit
    const limit = getFeatureLimit(userPlan, feature)
    
    // If unlimited, allow
    if (limit === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
        resetDate: new Date(),
        message: 'Unlimited',
        planId: userPlan,
        feature
      }
    }
    
    // Get current usage
    const current = await getCurrentUsage(userId, feature)
    const resetDate = getResetDate(feature)
    
    const allowed = current < limit
    
    return {
      allowed,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetDate,
      message: allowed 
        ? undefined 
        : `Limit reached. Resets on ${resetDate.toLocaleDateString()}`,
      planId: userPlan,
      feature
    }
  } catch (error) {
    console.error('Error validating plan access:', error)
    // Fail safe - deny access on error
    return {
      allowed: false,
      current: 0,
      limit: 0,
      remaining: 0,
      resetDate: new Date(),
      message: 'Error validating access. Please try again.',
      planId: 'free',
      feature
    }
  }
}

/**
 * Rate limiting based on plan
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  windowMinutes: number = 60
): Promise<RateLimitResult> {
  try {
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000
    const resetTime = now + windowMs
    
    // Get user plan for rate limits
    const userPlan = await getUserPlan(userId)
    
    // Define rate limits by plan
    const rateLimits = {
      free: { requests: 10, window: 60 }, // 10 requests per hour
      pro: { requests: 100, window: 60 }, // 100 requests per hour
      business: { requests: 1000, window: 60 }, // 1000 requests per hour
      waitlist_pro: { requests: 100, window: 60 },
      waitlist_business: { requests: 1000, window: 60 }
    }
    
    const limit = rateLimits[userPlan as keyof typeof rateLimits] || rateLimits.free
    
    // Check current rate limit usage
    const rateLimitKey = `USER_${userId}_RATE_LIMIT_${action}_${Math.floor(now / windowMs)}`
    
    const getCommand = new GetCommand({
      TableName: METADATA_TABLE,
      Key: { strategy_id: rateLimitKey }
    })
    
    const result = await getDocClient().send(getCommand)
    const currentCount = result.Item?.current_count || 0
    
    const allowed = currentCount < limit.requests
    
    if (allowed) {
      // Increment rate limit counter
      const putCommand = new PutCommand({
        TableName: METADATA_TABLE,
        Item: {
          strategy_id: rateLimitKey,
          type: 'RATE_LIMIT',
          user_id: userId,
          action: action,
          current_count: currentCount + 1,
          window_start: Math.floor(now / windowMs) * windowMs,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
      
      await getDocClient().send(putCommand)
    }
    
    return {
      allowed,
      remaining: Math.max(0, limit.requests - currentCount - (allowed ? 1 : 0)),
      resetTime,
      message: allowed 
        ? undefined 
        : `Rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 60000)} minutes.`
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // Fail safe - allow on error but log
    return {
      allowed: true,
      remaining: 0,
      resetTime: Date.now() + 60 * 60 * 1000,
      message: 'Rate limit check failed, allowing request'
    }
  }
}

/**
 * Middleware function to validate plan access in API routes
 */
export async function validateApiAccess(
  request: NextRequest,
  feature: string,
  requireAuth: boolean = true
): Promise<{ 
  allowed: boolean
  userId?: string
  planId?: string
  message?: string
  statusCode?: number
}> {
  try {
    // Check authentication if required
    if (requireAuth) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return {
          allowed: false,
          message: 'Authentication required',
          statusCode: 401
        }
      }
      
      const userId = session.user.id
      
      // Validate user ID
      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        return {
          allowed: false,
          message: 'Invalid user session',
          statusCode: 400
        }
      }
      
      // Check rate limiting
      const rateLimitResult = await checkRateLimit(userId, feature, 60)
      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          message: rateLimitResult.message,
          statusCode: 429
        }
      }
      
      // Check plan access
      const planValidation = await validatePlanAccess(userId, feature)
      
      return {
        allowed: planValidation.allowed,
        userId,
        planId: planValidation.planId,
        message: planValidation.message,
        statusCode: planValidation.allowed ? 200 : 403
      }
    }
    
    return { allowed: true }
  } catch (error) {
    console.error('Error validating API access:', error)
    return {
      allowed: false,
      message: 'Internal server error during validation',
      statusCode: 500
    }
  }
}

/**
 * Log security events for monitoring
 */
export async function logSecurityEvent(
  userId: string,
  event: string,
  details: any
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    const logCommand = new PutCommand({
      TableName: USER_ACTIONS_LOG_TABLE,
      Item: {
        user_id: userId,
        timestamp: timestamp,
        action_type: event,
        action_details: details,
        plan_id: await getUserPlan(userId),
        created_at: timestamp
      }
    })
    
    await getDocClient().send(logCommand)
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

/**
 * Log general user actions for analytics
 */
export async function logUserAction(
  userId: string,
  actionType: string,
  actionDetails: any = {}
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    const logCommand = new PutCommand({
      TableName: USER_ACTIONS_LOG_TABLE,
      Item: {
        user_id: userId,
        timestamp: timestamp,
        action_type: actionType,
        action_details: actionDetails,
        plan_id: await getUserPlan(userId),
        created_at: timestamp
      }
    })
    
    await getDocClient().send(logCommand)
  } catch (error) {
    console.error('Error logging user action:', error)
  }
}
