import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { checkRateLimit } from '../../../../lib/planSecurity'

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

    const { action } = await request.json()
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, action, 60) // 60 minute window
    
    return NextResponse.json(rateLimitResult)

  } catch (error) {
    console.error('Error checking rate limit:', error)
    return NextResponse.json(
      { error: 'Failed to check rate limit' },
      { status: 500 }
    )
  }
}
