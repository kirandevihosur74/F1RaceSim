import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { usageTracker } from '../../../../lib/usageTracking'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId') || 'free'
    
    const usageSummary = await usageTracker.getUsageSummary(userId, planId)
    
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

    // Check if user can perform the action
    const usageCheck = await usageTracker.checkUsage(userId, feature, planId)
    
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        details: usageCheck
      }, { status: 429 })
    }

    // Increment usage
    await usageTracker.incrementUsage(userId, feature)
    
    return NextResponse.json({ 
      success: true, 
      usage: usageCheck,
      message: `Usage tracked for ${feature}`
    })
  } catch (error) {
    console.error('Error tracking usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
