import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { createCheckoutSession, createCustomer } from '../../../../lib/stripe'
import { getStripePriceId } from '../../../../lib/stripe-prices'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, billingCycle = 'monthly' } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get Stripe price ID for the plan
    const priceId = getStripePriceId(planId, billingCycle as 'monthly' | 'yearly')
    
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan or plan not available' }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId: string | undefined
    
    try {
      // For now, we'll create a new customer each time
      // In production, you'd want to store and retrieve existing customer IDs
      const customer = await createCustomer(session.user.email, session.user.name || undefined)
      customerId = customer.id
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      priceId,
      customerId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard?success=true&plan=${planId}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing?canceled=true&plan=${planId}`
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 })
  }
}
