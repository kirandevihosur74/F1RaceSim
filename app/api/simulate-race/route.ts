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
    const body = await request.json()
    
    // Check usage before allowing simulation
    const usageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'simulations', planId: 'free' })
    })
    
    if (!usageResponse.ok) {
      const errorData = await usageResponse.json()
      if (usageResponse.status === 429) {
        return NextResponse.json({ 
          error: 'Simulation limit reached',
          details: errorData.details
        }, { status: 429 })
      }
      throw new Error(errorData.error || 'Failed to check usage')
    }
    
    const usageCheck = await usageResponse.json()
    
    console.log('Usage check for user:', userId, {
      allowed: usageCheck.usage.allowed,
      current: usageCheck.usage.current,
      limit: usageCheck.usage.limit,
      remaining: usageCheck.usage.remaining
    })

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
    const incrementResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'simulations', planId: 'free' })
    })
    
    console.log('Simulation completed, usage incremented for user:', userId)
    
    return NextResponse.json({
      ...data,
      usage: {
        current: usageCheck.usage.current + 1,
        limit: usageCheck.usage.limit,
        remaining: usageCheck.usage.remaining - 1
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 