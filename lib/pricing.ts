export interface PricingFeature {
  id: string
  name: string
  included: boolean
}

export interface PricingPlan {
  id: 'free' | 'pro' | 'business'
  name: string
  price: number
  description: string
  features: PricingFeature[]
  popular?: boolean
  cta: string
  limits: {
    simulationsPerDay: number
    strategies: number
  }
}

export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    cta: 'Get Started Free',
    limits: {
      simulationsPerDay: 1,
      strategies: 5,
    },
    features: [
      { id: 'basic-strategy', name: 'Basic Race Strategy Creation', included: true },
      { id: 'limited-simulations', name: '1 Simulation per Day', included: true },
      { id: 'strategy-comparison', name: 'Strategy Comparison', included: true },
      { id: 'weather-data', name: 'Weather Data', included: true },
      { id: 'track-selection', name: 'Track Selection', included: true },
      { id: 'advanced-analytics', name: 'Advanced Analytics', included: false },
      { id: 'unlimited-simulations', name: 'Unlimited Simulations', included: false },
      { id: 'ai-recommendations', name: '1 AI Recommendation', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    description: 'Advanced features for enthusiasts',
    cta: 'Upgrade to Pro',
    popular: true,
    limits: {
      simulationsPerDay: -1, // Unlimited
      strategies: 50,
    },
    features: [
      { id: 'basic-strategy', name: 'Basic Race Strategy Creation', included: true },
      { id: 'limited-simulations', name: '3 Simulations per Day', included: false },
      { id: 'strategy-comparison', name: 'Strategy Comparison', included: true },
      { id: 'weather-data', name: 'Weather Data', included: true },
      { id: 'track-selection', name: 'Track Selection', included: true },
      { id: 'advanced-analytics', name: 'Advanced Analytics', included: true },
      { id: 'unlimited-simulations', name: 'Unlimited Simulations', included: true },
      { id: 'ai-recommendations', name: 'Unlimited AI Recommendations', included: true },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 29.99,
    description: 'Enterprise features for teams',
    cta: 'Upgrade to Business',
    limits: {
      simulationsPerDay: -1, // Unlimited
      strategies: -1, // Unlimited
    },
    features: [
      { id: 'basic-strategy', name: 'Basic Race Strategy Creation', included: true },
      { id: 'limited-simulations', name: '3 Simulations per Day', included: false },
      { id: 'strategy-comparison', name: 'Strategy Comparison', included: true },
      { id: 'weather-data', name: 'Weather Data', included: true },
      { id: 'track-selection', name: 'Track Selection', included: true },
      { id: 'advanced-analytics', name: 'Advanced Analytics', included: true },
      { id: 'unlimited-simulations', name: 'Unlimited Simulations', included: true },
      { id: 'ai-recommendations', name: 'Unlimited AI Recommendations', included: true },
    ],
  },
]

export const getPlanById = (id: string): PricingPlan | undefined => {
  return pricingPlans.find(plan => plan.id === id)
}

export const getCurrentUserPlan = (userPlan?: string): PricingPlan => {
  return getPlanById(userPlan as any) || pricingPlans[0] // Default to free
}

export const isFeatureIncluded = (planId: string, featureId: string): boolean => {
  const plan = getPlanById(planId)
  if (!plan) return false
  
  const feature = plan.features.find(f => f.id === featureId)
  return feature?.included || false
}
