import Stripe from 'stripe'

// Initialize Stripe with your secret key
let stripe: Stripe | null = null

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil'
    })
  }
  return stripe
}

export interface StripeCustomer {
  id: string
  email: string
  name?: string
  subscription?: {
    id: string
    status: string
  }
}

export interface CreateCheckoutSessionParams {
  priceId: string
  customerId?: string
  customerEmail?: string
  successUrl?: string
  cancelUrl?: string
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

/**
 * Create a Stripe customer
 */
export const createCustomer = async (email: string, name?: string): Promise<Stripe.Customer> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }
  
  return await stripeInstance.customers.create({
    email,
    name,
    metadata: {
      source: 'f1-race-simulator'
    }
  })
}

/**
 * Create a checkout session for subscription
 */
export const createCheckoutSession = async ({
  priceId,
  customerId,
  customerEmail,
  successUrl,
  cancelUrl
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  }

  // If customer exists, use their ID, otherwise create new customer
  if (customerId) {
    sessionParams.customer = customerId
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail
  }

  return await stripeInstance.checkout.sessions.create(sessionParams)
}

/**
 * Create a customer portal session for managing subscriptions
 */
export const createPortalSession = async ({
  customerId,
  returnUrl
}: CreatePortalSessionParams): Promise<Stripe.BillingPortal.Session> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  return await stripeInstance.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

/**
 * Get customer details including subscription
 */
export const getCustomer = async (customerId: string): Promise<StripeCustomer | null> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  try {
    const customer = await stripeInstance.customers.retrieve(customerId, {
      expand: ['subscriptions']
    }) as Stripe.Customer & { subscriptions: Stripe.ApiList<Stripe.Subscription> }

    if (customer.deleted) {
      return null
    }

    const activeSubscription = customer.subscriptions?.data.find(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )

    return {
      id: customer.id,
      email: customer.email!,
      name: customer.name || undefined,
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status
      } : undefined
    }
  } catch (error) {
    console.error('Error retrieving customer:', error)
    return null
  }
}

/**
 * Get subscription details
 */
export const getSubscription = async (subscriptionId: string): Promise<Stripe.Subscription | null> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  try {
    return await stripeInstance.subscriptions.retrieve(subscriptionId)
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

/**
 * Cancel subscription at period end
 */
export const cancelSubscription = async (subscriptionId: string): Promise<Stripe.Subscription | null> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  try {
    return await stripeInstance.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return null
  }
}

/**
 * Reactivate subscription
 */
export const reactivateSubscription = async (subscriptionId: string): Promise<Stripe.Subscription | null> => {
  const stripeInstance = getStripe()
  if (!stripeInstance) {
    throw new Error('Stripe not configured')
  }

  try {
    return await stripeInstance.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    return null
  }
}

export default getStripe
