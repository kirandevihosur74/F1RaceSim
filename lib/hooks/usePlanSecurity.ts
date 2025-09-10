import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface PlanSecurityResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetDate: string
  message?: string
  planId: string
  feature: string
  loading: boolean
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  message?: string
}

/**
 * Hook for client-side plan security validation
 */
export function usePlanSecurity() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Check if user can perform an action
   */
  const checkPlanAccess = useCallback(async (feature: string): Promise<PlanSecurityResult> => {
    if (!session?.user?.id) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetDate: new Date().toISOString(),
        message: 'Authentication required',
        planId: 'free',
        feature,
        loading: false,
        error: 'Not authenticated'
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/usage?feature=${feature}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to check usage: ${response.status}`)
      }

      const data = await response.json()
      const featureUsage = data.usage?.find((u: any) => u.feature === feature)
      
      if (!featureUsage) {
        // Return safe fallback for unknown features
        return {
          allowed: true,
          current: 0,
          limit: -1,
          remaining: -1,
          resetDate: new Date().toISOString(),
          message: 'Feature access available',
          planId: 'free',
          feature,
          loading: false
        }
      }

      const result: PlanSecurityResult = {
        allowed: featureUsage.limit === -1 || featureUsage.current < featureUsage.limit,
        current: featureUsage.current || 0,
        limit: featureUsage.limit || -1,
        remaining: featureUsage.limit === -1 ? -1 : Math.max(0, (featureUsage.limit || 0) - (featureUsage.current || 0)),
        resetDate: featureUsage.resetDate || new Date().toISOString(),
        message: featureUsage.limit === -1 
          ? 'Unlimited usage available' 
          : featureUsage.current >= featureUsage.limit
            ? `Limit reached. Resets on ${new Date(featureUsage.resetDate).toLocaleDateString()}`
            : `You have ${Math.max(0, (featureUsage.limit || 0) - (featureUsage.current || 0))} remaining`,
        planId: featureUsage.planId || 'free',
        feature,
        loading: false
      }

      return result
    } catch (err) {
      console.error('Error checking plan access:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        resetDate: new Date().toISOString(),
        message: 'Error checking access',
        planId: 'free',
        feature,
        loading: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  /**
   * Check rate limiting
   */
  const checkRateLimit = useCallback(async (action: string): Promise<RateLimitResult> => {
    if (!session?.user?.id) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now(),
        message: 'Authentication required'
      }
    }

    try {
      const response = await fetch('/api/users/rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Rate limit check failed: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error checking rate limit:', err)
      // Fail safe - allow on error
      return {
        allowed: true,
        remaining: 0,
        resetTime: Date.now(),
        message: 'Rate limit check failed, allowing request'
      }
    }
  }, [session?.user?.id])

  /**
   * Validate before performing an action
   */
  const validateAction = useCallback(async (feature: string): Promise<{
    canProceed: boolean
    message?: string
    upgradeRequired?: boolean
  }> => {
    const planCheck = await checkPlanAccess(feature)
    
    if (!planCheck.allowed) {
      return {
        canProceed: false,
        message: planCheck.message,
        upgradeRequired: planCheck.planId === 'free'
      }
    }

    // Check rate limiting for sensitive actions
    if (['simulations', 'ai_recommendations'].includes(feature)) {
      const rateLimitCheck = await checkRateLimit(feature)
      if (!rateLimitCheck.allowed) {
        return {
          canProceed: false,
          message: rateLimitCheck.message
        }
      }
    }

    return {
      canProceed: true
    }
  }, [checkPlanAccess, checkRateLimit])

  /**
   * Get user's current plan information
   */
  const getUserPlan = useCallback(async (): Promise<{
    planId: string
    features: string[]
    limits: Record<string, number>
  }> => {
    if (!session?.user?.id) {
      return {
        planId: 'free',
        features: [],
        limits: {}
      }
    }

    try {
      const response = await fetch('/api/users/plan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user plan')
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error getting user plan:', err)
      return {
        planId: 'free',
        features: [],
        limits: {}
      }
    }
  }, [session?.user?.id])

  return {
    checkPlanAccess,
    checkRateLimit,
    validateAction,
    getUserPlan,
    loading,
    error
  }
}

/**
 * Hook for specific feature access
 */
export function useFeatureAccess(feature: string) {
  const { checkPlanAccess, validateAction, loading, error } = usePlanSecurity()
  const [accessResult, setAccessResult] = useState<PlanSecurityResult | null>(null)

  useEffect(() => {
    if (feature) {
      checkPlanAccess(feature).then(setAccessResult)
    }
  }, [feature, checkPlanAccess])

  const refreshAccess = useCallback(() => {
    if (feature) {
      checkPlanAccess(feature).then(setAccessResult)
    }
  }, [feature, checkPlanAccess])

  const canPerformAction = useCallback(async () => {
    const validation = await validateAction(feature)
    return validation
  }, [feature, validateAction])

  return {
    access: accessResult,
    canPerformAction,
    refreshAccess,
    loading,
    error
  }
}
