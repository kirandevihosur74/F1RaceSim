import { NextRequest, NextResponse } from 'next/server'
import { validateApiAccess, incrementUsage, logSecurityEvent, logUserAction } from '../../../lib/planSecurity'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Validate plan access and rate limiting
    const accessValidation = await validateApiAccess(request, 'ai_recommendations', true)
    
    if (!accessValidation.allowed) {
      // Log security event for monitoring
      if (accessValidation.userId) {
        await logSecurityEvent(accessValidation.userId, 'AI_RECOMMENDATION_ACCESS_DENIED', {
          reason: accessValidation.message,
          planId: accessValidation.planId,
          timestamp: new Date().toISOString()
        })
      }
      
      return NextResponse.json({ 
        error: accessValidation.message || 'Access denied',
        planId: accessValidation.planId,
        upgradeRequired: accessValidation.statusCode === 403
      }, { status: accessValidation.statusCode || 403 })
    }

    const userId = accessValidation.userId!
    const planId = accessValidation.planId!
    
    console.log('AI Recommendation request validated for user:', userId, 'plan:', planId)
    
    // Increment usage after successful validation
    try {
      await incrementUsage(userId, 'ai_recommendations')
      console.log('AI recommendation usage incremented for user:', userId)
    } catch (error) {
      console.error('Error incrementing AI recommendation usage:', error)
      // Continue with recommendation even if usage tracking fails
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
    
    // Log successful AI recommendation action
    try {
      await logUserAction(userId, 'AI_RECOMMENDATION_COMPLETED', {
        scenario: body.scenario,
        recommendation_type: data.type || 'strategy_recommendation'
      })
    } catch (error) {
      console.error('Error logging AI recommendation action:', error)
      // Continue even if logging fails
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