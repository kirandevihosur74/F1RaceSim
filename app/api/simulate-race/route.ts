import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { usageTracker } from '../../../lib/usageTracking'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    
    // Check usage before allowing simulation
    const usageCheck = await usageTracker.checkUsage(userId, 'simulations', 'free')
    
    console.log('Usage check for user:', userId, {
      allowed: usageCheck.allowed,
      current: usageCheck.current,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining
    })
    
    if (!usageCheck.allowed) {
      return NextResponse.json({ 
        error: 'Simulation limit reached',
        details: {
          message: 'You have reached your daily simulation limit. Upgrade to Pro for unlimited simulations!',
          current: usageCheck.current,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining,
          resetDate: usageCheck.resetDate
        }
      }, { status: 429 })
    }

    // Forward the request to your backend simulation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/simulate-race'
    const simResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    if (!simResponse.ok) {
      const errorData = await simResponse.json()
      return NextResponse.json(errorData, { status: simResponse.status })
    }
    
    const data = await simResponse.json()
    
    // Increment usage after successful simulation
    await usageTracker.incrementUsage(userId, 'simulations')
    
    console.log('Simulation completed, usage incremented for user:', userId)
    
    return NextResponse.json({
      ...data,
      usage: {
        current: usageCheck.current + 1,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining - 1
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 