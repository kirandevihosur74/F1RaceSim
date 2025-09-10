import { NextRequest, NextResponse } from 'next/server'
import { validateApiAccess, incrementUsage, logSecurityEvent } from '../../../lib/planSecurity'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Validate plan access and rate limiting
    const accessValidation = await validateApiAccess(request, 'simulations', true)
    
    if (!accessValidation.allowed) {
      // Log security event for monitoring
      if (accessValidation.userId) {
        await logSecurityEvent(accessValidation.userId, 'SIMULATION_ACCESS_DENIED', {
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
    
    const body = await request.json()
    
    console.log('Simulation request validated for user:', userId, 'plan:', planId)
    
    // Increment usage after successful validation
    try {
      await incrementUsage(userId, 'simulations')
      console.log('Usage incremented for user:', userId)
    } catch (error) {
      console.error('Error incrementing usage:', error)
      // Continue with simulation even if usage tracking fails
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
    
    console.log('Simulation completed, usage incremented for user:', userId)
    
    // Get updated usage information
    const { getCurrentUsage, getFeatureLimit } = await import('../../../lib/planSecurity')
    const currentUsage = await getCurrentUsage(userId, 'simulations')
    const limit = getFeatureLimit(planId, 'simulations')
    
    return NextResponse.json({
      ...data,
      usage: {
        current: currentUsage,
        limit: limit,
        remaining: limit === -1 ? -1 : Math.max(0, limit - currentUsage)
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 