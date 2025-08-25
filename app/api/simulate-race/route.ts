import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // Validate userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.error('Invalid userId in session:', userId)
      return NextResponse.json({ error: 'Invalid user session' }, { status: 400 })
    }
    
    const body = await request.json()
    
    // Check usage before allowing simulation (direct logic instead of internal API call)
    console.log('Checking usage directly for user:', userId)
    
    // Declare variables in outer scope
    let currentUsage = 0
    let limit = 1 // Default to free plan limit
    
    try {
      // Import the usage logic directly
      const { getCurrentUserPlan } = await import('../../../lib/pricing')
      const { dynamoDb, TABLES } = await import('../../../lib/dynamodb')
      
      const plan = getCurrentUserPlan('free')
      const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const usageKey = `USER_${userId}_USAGE_simulations_${currentDate}`
      
      // Get current usage from DynamoDB
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb')
      const getCommand = new GetCommand({
        TableName: TABLES.STRATEGY_METADATA,
        Key: { strategy_id: usageKey }
      })
      
      const result = await dynamoDb.send(getCommand)
      currentUsage = result.Item?.current_count || 0
      limit = plan.limits.simulationsPerDay
      
      console.log('Usage check result:', {
        current: currentUsage,
        limit,
        remaining: Math.max(0, limit - currentUsage)
      })
      
      // Check if user can run simulation
      if (limit !== -1 && currentUsage >= limit) {
        const resetDate = new Date()
        resetDate.setDate(resetDate.getDate() + 1)
        resetDate.setHours(0, 0, 0, 0)
        
        return NextResponse.json({ 
          error: 'Simulation limit reached',
          details: {
            message: 'You have reached your daily simulation limit. Upgrade to Pro for unlimited simulations!',
            current: currentUsage,
            limit,
            remaining: 0,
            resetDate: resetDate.toISOString()
          }
        }, { status: 429 })
      }
      
      console.log('Usage check passed for user:', userId, {
        current: currentUsage,
        limit,
        remaining: Math.max(0, limit - currentUsage)
      })
      
    } catch (error) {
      console.error('Error checking usage directly:', error)
      // If usage check fails, allow simulation to proceed (fail-safe)
      console.log('Usage check failed, allowing simulation to proceed')
    }

    // Forward the request to your backend simulation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/simulate-race'
    
    console.log('Backend URL:', backendUrl)
    console.log('Request body:', body)
    
    // Check if backend URL is valid
    if (!backendUrl || backendUrl.includes('your-backend-url.com') || backendUrl.includes('your-api-gateway-url')) {
      console.error('Invalid backend URL:', backendUrl)
      return NextResponse.json({ 
        error: 'Backend not configured',
        details: `NEXT_PUBLIC_API_URL is not set correctly. Current value: ${process.env.NEXT_PUBLIC_API_URL || 'NOT_SET'}. Please configure your backend URL.`
      }, { status: 500 })
    }
    
    const simResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    console.log('Backend response status:', simResponse.status)
    console.log('Backend response headers:', Object.fromEntries(simResponse.headers.entries()))
    
    if (!simResponse.ok) {
      const errorData = await simResponse.json()
      console.log('Backend error response:', errorData)
      return NextResponse.json(errorData, { status: simResponse.status })
    }
    
    const data = await simResponse.json()
    
    // Increment usage after successful simulation
    const incrementResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'simulations', planId: 'free' })
    })
    
    console.log('Simulation completed, usage incremented for user:', userId)
    
    return NextResponse.json({
      ...data,
      usage: {
        current: currentUsage + 1,
        limit: limit,
        remaining: Math.max(0, limit - (currentUsage + 1))
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 