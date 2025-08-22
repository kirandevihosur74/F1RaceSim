// Stripe Price IDs for your subscription plans
// You'll need to create these in your Stripe dashboard and replace with actual IDs

export const STRIPE_PRICE_IDS = {
  // Free plan (no Stripe price needed)
  free: null,
  
  // Pro plan - $9.99/month
  pro: {
    monthly: 'price_1ABC123DEF456GHI789JKL', // Replace with your actual price ID
    yearly: 'price_1ABC123DEF456GHI789JKL'   // Replace with your actual price ID
  },
  
  // Business plan - $29.99/month
  business: {
    monthly: 'price_1ABC123DEF456GHI789JKL', // Replace with your actual price ID
    yearly: 'price_1ABC123DEF456GHI789JKL'   // Replace with your actual price ID
  }
} as const

export type StripePlanId = keyof typeof STRIPE_PRICE_IDS

/**
 * Get the Stripe price ID for a plan and billing cycle
 */
export const getStripePriceId = (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): string | null => {
  const plan = STRIPE_PRICE_IDS[planId as StripePlanId]
  
  if (!plan || planId === 'free') {
    return null
  }
  
  return plan[billingCycle] || plan.monthly
}

/**
 * Get the plan ID from a Stripe price ID
 */
export const getPlanIdFromPriceId = (priceId: string): StripePlanId | null => {
  for (const [planId, prices] of Object.entries(STRIPE_PRICE_IDS)) {
    if (prices && (prices.monthly === priceId || prices.yearly === priceId)) {
      return planId as StripePlanId
    }
  }
  return null
}

/**
 * Check if a plan requires Stripe integration
 */
export const requiresStripe = (planId: string): boolean => {
  return planId !== 'free' && STRIPE_PRICE_IDS[planId as StripePlanId] !== null
}
