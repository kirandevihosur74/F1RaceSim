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
    
    // Check usage before allowing simulation (GET request, not POST)
    const usageResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/users/usage?planId=free`)
    
    if (!usageResponse.ok) {
      throw new Error('Failed to check usage')
    }
    
    const usageData = await usageResponse.json()
    const simulationUsage = usageData.usage.find((u: any) => u.feature === 'simulations')
    
    if (!simulationUsage) {
      throw new Error('Simulation usage not found')
    }
    
    // Check if user can run simulation
    if (simulationUsage.limit !== -1 && simulationUsage.current >= simulationUsage.limit) {
      return NextResponse.json({ 
        error: 'Simulation limit reached',
        details: {
          message: 'You have reached your daily simulation limit. Upgrade to Pro for unlimited simulations!',
          current: simulationUsage.current,
          limit: simulationUsage.limit,
          remaining: 0,
          resetDate: simulationUsage.resetDate
        }
      }, { status: 429 })
    }
    
    console.log('Usage check for user:', userId, {
      current: simulationUsage.current,
      limit: simulationUsage.limit,
      remaining: simulationUsage.remaining
    })

    // Forward the request to your backend simulation endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') + '/simulate-race'
    
    console.log('Backend URL:', backendUrl)
    console.log('Request body:', body)
    
    // Check if backend URL is valid
    if (!backendUrl || backendUrl.includes('your-backend-url.com') || backendUrl.includes('your-api-gateway-url')) {
      return NextResponse.json({ 
        error: 'Backend not configured',
        details: 'NEXT_PUBLIC_API_URL is not set correctly. Please configure your backend URL.'
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
        current: simulationUsage.current + 1,
        limit: simulationUsage.limit,
        remaining: simulationUsage.remaining - 1
      }
    })
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
} 