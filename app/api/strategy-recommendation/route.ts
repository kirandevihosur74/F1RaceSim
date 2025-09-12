import { NextRequest, NextResponse } from 'next/server'
import { validateApiAccess, incrementUsage, logSecurityEvent, logUserAction } from '../../../lib/planSecurity'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

// Mock recommendation function for fallback when backend is unreachable
function getMockRecommendation(scenario: string): any {
  const scenario_lower = scenario.toLowerCase()
  
  // Define recommendation templates based on scenario characteristics
  const recommendations = [
    {
      keywords: ["aggressive", "soft"],
      recommendation: "Your aggressive approach with Soft compounds may lead to premature tire degradation. Consider a more conservative middle stint with Medium tires to preserve performance for the final push. Monitor tire wear closely around lap 25-30."
    },
    {
      keywords: ["conservative", "hard"],
      recommendation: "The conservative approach with Hard compounds provides good tire management but may cost you track position. Consider an earlier pit stop to switch to Medium compounds for better pace while maintaining reasonable tire life."
    },
    {
      keywords: ["balanced", "medium"],
      recommendation: "Your balanced strategy looks well-placed. The Medium-Hard-Soft progression should work effectively. Consider moving the final pit stop 2-3 laps earlier to maximize the Soft compound's performance advantage in the closing laps."
    },
    {
      keywords: ["wet", "intermediate"],
      recommendation: "In wet conditions, prioritize tire temperature management. The Intermediate compounds need proper warm-up. Consider a longer first stint to build tire temperature, then switch to fresh Intermediates when conditions improve slightly."
    },
    {
      keywords: ["one-stop"],
      recommendation: "A one-stop strategy can be effective but requires careful tire management. Start with Hard compounds, push hard in the middle stint, then switch to Medium for the final push. Monitor tire wear closely to avoid performance cliff."
    },
    {
      keywords: ["two-stop"],
      recommendation: "Two-stop strategy provides flexibility for changing conditions. Consider using Soft-Medium-Soft if track position is crucial, or Medium-Hard-Medium for better tire management. Time your pit stops to avoid traffic."
    }
  ]
  
  // Find the best matching recommendation
  let best_match = recommendations[0] // Default
  let max_matches = 0
  
  for (const rec of recommendations) {
    const matches = rec.keywords.filter(keyword => scenario_lower.includes(keyword)).length
    if (matches > max_matches) {
      max_matches = matches
      best_match = rec
    }
  }
  
  // Add some randomization for variety
  if (Math.random() < 0.3) {
    const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)]
    return {
      pit_stop_timing: randomRec.recommendation,
      tire_compound_strategy: "Consider the recommended approach based on track conditions",
      driver_approach_adjustments: "Monitor tire wear and adjust driving style accordingly",
      potential_time_savings_or_risks: "Potential time savings of 2-5 seconds with proper execution"
    }
  }
  
  return {
    pit_stop_timing: best_match.recommendation,
    tire_compound_strategy: "Consider the recommended approach based on track conditions",
    driver_approach_adjustments: "Monitor tire wear and adjust driving style accordingly",
    potential_time_savings_or_risks: "Potential time savings of 2-5 seconds with proper execution"
  }
}

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
      
      // Provide more specific error message for daily limit
      const errorMessage = accessValidation.message?.includes('Limit reached') 
        ? 'Daily AI recommendation limit reached. Upgrade to Pro for unlimited recommendations.'
        : accessValidation.message || 'Access denied'
      
      return NextResponse.json({ 
        error: errorMessage,
        planId: accessValidation.planId,
        upgradeRequired: accessValidation.statusCode === 403,
        current: accessValidation.current || 0,
        limit: accessValidation.limit || 1
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
    
    let data: any
    
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(errorData, { status: response.status })
      }
      
      data = await response.json()
    } catch (fetchError) {
      console.error('Backend fetch failed, using fallback recommendation:', fetchError)
      
      // Fallback to mock recommendation when backend is unreachable
      data = getMockRecommendation(scenario)
    }
    
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
    
    // Return the data (either from backend or fallback)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Strategy recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to get strategy recommendation' },
      { status: 500 }
    )
  }
} 