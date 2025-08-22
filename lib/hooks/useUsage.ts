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
        throw new Error('Failed to fetch usage')
      }
      
      const data = await response.json()
      setUsage(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const checkUsage = useCallback(async (feature: string): Promise<UsageCheck> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    try {
      const response = await fetch('/api/users/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, planId: 'free' }) // TODO: Get actual plan
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          return errorData.details
        }
        throw new Error(errorData.error || 'Failed to check usage')
      }

      const data = await response.json()
      return data.usage
    } catch (err) {
      console.error('Error checking usage:', err)
      throw err
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
        const errorData = await response.json()
        if (response.status === 429) {
          // Usage limit exceeded
          return false
        }
        throw new Error(errorData.error || 'Failed to increment usage')
      }

      // Refresh usage data
      await fetchUsage()
      return true
    } catch (err) {
      console.error('Error incrementing usage:', err)
      return false
    }
  }, [session?.user?.id, fetchUsage])

  const refreshUsage = useCallback(async () => {
    await fetchUsage()
  }, [fetchUsage])

  useEffect(() => {
    fetchUsage()
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
