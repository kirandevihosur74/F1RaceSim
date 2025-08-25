import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Declare variables in outer scope
    let currentUsage = 0
    let limit = 1 // Default to free plan limit
    let currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    let dynamoDb: any = null
    let TABLES: any = null
    
    // Check usage limits before allowing AI recommendation
    try {
      // Import the usage logic directly
      const { getCurrentUserPlan } = await import('../../../lib/pricing')
      const dynamoDbModule = await import('../../../lib/dynamodb')
      dynamoDb = dynamoDbModule.dynamoDb
      TABLES = dynamoDbModule.TABLES
      
      const plan = getCurrentUserPlan('free') // TODO: Get actual user plan
      currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const usageKey = `USER_${userId}_USAGE_ai_recommendations_${currentDate}`
      
      // Get current usage from DynamoDB
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb')
      const getCommand = new GetCommand({
        TableName: TABLES.STRATEGY_METADATA,
        Key: { strategy_id: usageKey }
      })
      
      const result = await dynamoDb.send(getCommand)
      currentUsage = result.Item?.current_count || 0
      limit = plan.id === 'free' ? 1 : -1 // Free: 1, Pro+: unlimited
      
      console.log('AI Recommendation usage check:', {
        userId,
        current: currentUsage,
        limit,
        remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - currentUsage)
      })
      
      // Check if user can get AI recommendation
      if (limit !== -1 && currentUsage >= limit) {
        const resetDate = new Date()
        resetDate.setDate(resetDate.getDate() + 1)
        resetDate.setHours(0, 0, 0, 0)
        
        return NextResponse.json({ 
          error: 'Rate limit exceeded',
          details: {
            message: 'You have reached the maximum number of strategy recommendations allowed today.',
            current: currentUsage,
            limit,
            remaining: 0,
            resetDate: resetDate.toISOString()
          }
        }, { status: 429 })
      }
      
    } catch (error) {
      console.error('Error checking AI recommendation usage:', error)
      // If usage check fails, allow recommendation to proceed (fail-safe)
      console.log('Usage check failed, allowing AI recommendation to proceed')
    }

    const body = await request.json()
    const { scenario } = body
    
    // Call the backend strategy recommendation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/strategy-recommendation'
    
    if (!backendUrl || backendUrl.includes('your-backend-url.com') || backendUrl.includes('your-api-gateway-url')) {
      return NextResponse.json({ 
        error: 'Backend not configured',
        details: 'NEXT_PUBLIC_API_URL is not set correctly. Please configure your backend URL.'
      }, { status: 500 })
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }
    
    const data = await response.json()
    
    // Increment usage after successful recommendation
    try {
      const { PutCommand } = await import('@aws-sdk/lib-dynamodb')
      const putCommand = new PutCommand({
        TableName: TABLES.STRATEGY_METADATA,
        Item: {
          strategy_id: `USER_${userId}_USAGE_ai_recommendations_${currentDate}`,
          user_id: userId,
          type: 'USER_USAGE',
          feature: 'ai_recommendations',
          current_count: currentUsage + 1,
          limit,
          date: currentDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })
      
      await dynamoDb.send(putCommand)
      console.log('AI Recommendation usage incremented for user:', userId)
      
    } catch (error) {
      console.error('Error incrementing AI recommendation usage:', error)
      // Don't fail the request if usage tracking fails
    }
    
    // Preserve the status code from the backend
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Strategy recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to get strategy recommendation' },
      { status: 500 }
    )
  }
} 