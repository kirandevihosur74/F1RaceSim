import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usageTracker, UsageLimit, UsageCheck } from '../usageTracking'

export interface UseUsageReturn {
  usage: UsageLimit[]
  loading: boolean
  error: string | null
  checkUsage: (feature: string) => Promise<UsageCheck>
  incrementUsage: (feature: string) => Promise<boolean>
  refreshUsage: () => Promise<void>
}

export function useUsage(): UseUsageReturn {
  const { data: session } = useSession()
  const [usage, setUsage] = useState<UsageLimit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users/usage?planId=free`) // TODO: Get actual plan
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Usage API error:', response.status, errorData)
        throw new Error(errorData.error || `Failed to fetch usage: ${response.status}`)
      }
      
      const data = await response.json()
      setUsage(data.usage || [])
    } catch (err) {
      console.error('Error in fetchUsage:', err)
      // Don't crash the entire page, just set a generic error
      setError('Unable to load usage data')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const checkUsage = useCallback(async (feature: string): Promise<UsageCheck> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      // Use GET request to check usage without incrementing
      const response = await fetch(`/api/users/usage?planId=free&feature=${feature}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Usage check API error:', response.status, errorData)
        throw new Error(errorData.error || `Failed to check usage: ${response.status}`)
      }

      const data = await response.json()
      const featureUsage = data.usage?.find((u: any) => u.feature === feature)
      
      if (!featureUsage) {
        console.warn('Feature usage not found for:', feature)
        // Return a safe fallback
        return {
          allowed: true, // Allow by default if we can't determine
          current: 0,
          limit: -1, // Unlimited
          remaining: -1,
          resetDate: new Date(),
          message: 'Usage data unavailable, allowing access'
        }
      }

      // Return usage check result
      return {
        allowed: featureUsage.limit === -1 || featureUsage.current < featureUsage.limit,
        current: featureUsage.current || 0,
        limit: featureUsage.limit || -1,
        remaining: featureUsage.limit === -1 ? -1 : Math.max(0, (featureUsage.limit || 0) - (featureUsage.current || 0)),
        resetDate: featureUsage.resetDate || new Date().toISOString(),
        message: featureUsage.limit === -1 
          ? 'Unlimited usage available' 
          : `You have ${Math.max(0, (featureUsage.limit || 0) - (featureUsage.current || 0))} simulations remaining today`
      }
    } catch (err) {
      console.error('Error checking usage:', err)
      // Return a safe fallback instead of throwing
      return {
        allowed: true, // Allow by default if we can't determine
        current: 0,
        limit: -1, // Unlimited
        remaining: -1,
        resetDate: new Date(),
        message: 'Usage check failed, allowing access'
      }
    }
  }, [session?.user?.id])

  const incrementUsage = useCallback(async (feature: string): Promise<boolean> => {
    if (!session?.user?.id) {
      return false
    }

    try {
      const response = await fetch('/api/users/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, planId: 'free' }) // TODO: Get actual plan
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Usage increment API error:', response.status, errorData)
        
        if (response.status === 429) {
          // Usage limit exceeded
          return false
        }
        
        throw new Error(errorData.error || `Failed to increment usage: ${response.status}`)
      }

      // Refresh usage data
      await fetchUsage()
      return true
    } catch (err) {
      console.error('Error incrementing usage:', err)
      // Don't crash the page, just return false
      return false
    }
  }, [session?.user?.id, fetchUsage])

  const refreshUsage = useCallback(async () => {
    await fetchUsage()
  }, [fetchUsage])

  useEffect(() => {
    // Wrap in try-catch to prevent unhandled errors from crashing the page
    try {
      fetchUsage()
    } catch (error) {
      console.error('Error in useUsage useEffect:', error)
      setError('Failed to initialize usage tracking')
      setLoading(false)
    }
  }, [fetchUsage])

  return {
    usage,
    loading,
    error,
    checkUsage,
    incrementUsage,
    refreshUsage
  }
}
