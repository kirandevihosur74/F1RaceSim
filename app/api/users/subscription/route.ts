import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    
    // TODO: Get user subscription from database
    // For now, return default free plan
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

    // TODO: Update user subscription in database
    // For now, just return success
    const subscription = {
      id: 'updated',
      userId,
      planId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: null,
      subscriptionId: null
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
