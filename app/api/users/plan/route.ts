import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { getUserPlan } from '../../../../lib/planSecurity'
import { getCurrentUserPlan } from '../../../../lib/pricing'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get user's actual plan
    const userPlanId = await getUserPlan(userId)
    const plan = getCurrentUserPlan(userPlanId)
    
    // Extract features and limits
    const features = plan.features
      .filter(feature => feature.included)
      .map(feature => feature.id)
    
    const limits = {
      simulations: plan.limits.simulationsPerDay,
      strategies: plan.limits.strategies,
      ai_recommendations: userPlanId === 'free' ? 1 : -1
    }

    return NextResponse.json({
      planId: userPlanId,
      planName: plan.name,
      features,
      limits,
      isUpgraded: userPlanId !== 'free'
    })

  } catch (error) {
    console.error('Error getting user plan:', error)
    return NextResponse.json(
      { error: 'Failed to get user plan' },
      { status: 500 }
    )
  }
}
