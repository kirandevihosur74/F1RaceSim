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
    const { feature } = await request.json()
    
    // This is a debug endpoint - in production, you'd want to add admin checks
    console.log(`Debug: Resetting usage for user ${userId}, feature: ${feature}`)
    
    // For now, just return success - the usage tracker will reset on next request
    // In a real implementation, you'd update the database
    
    return NextResponse.json({
      message: 'Usage reset successfully',
      userId,
      feature,
      note: 'This is a debug endpoint. Usage will be reset to 0.'
    })
  } catch (error) {
    console.error('Error resetting usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
