import React from 'react'
import { useUsage } from '../lib/hooks/useUsage'
import { useSession } from 'next-auth/react'
import { BarChart3, Zap, Brain, Target } from 'lucide-react'

const UsageDisplay = () => {
  const { data: session } = useSession()
  const { usage, loading, error } = useUsage()

  if (!session?.user) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <p className="text-red-600 dark:text-red-400 text-sm">Error loading usage: {error}</p>
      </div>
    )
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'simulations':
        return <Zap className="w-4 h-4 text-blue-500" />
      case 'ai_recommendations':
        return <Brain className="w-4 h-4 text-purple-500" />
      case 'strategies':
        return <Target className="w-4 h-4 text-green-500" />
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />
    }
  }

  const getFeatureLabel = (feature: string) => {
    switch (feature) {
      case 'simulations':
        return 'Simulations'
      case 'ai_recommendations':
        return 'AI Recommendations'
      case 'strategies':
        return 'Strategies'
      default:
        return feature
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Usage Summary</span>
      </h3>
      
      <div className="space-y-4">
        {usage.map((item) => (
          <div key={item.feature} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {getFeatureIcon(item.feature)}
                <span className="text-gray-700 dark:text-gray-300">
                  {getFeatureLabel(item.feature)}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                {item.isUnlimited ? 'Unlimited' : `${item.current}/${item.limit}`}
              </span>
            </div>
            
            {!item.isUnlimited && (
              <>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(getUsagePercentage(item.current, item.limit))}`}
                    style={{ width: `${getUsagePercentage(item.current, item.limit)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {item.limit - item.current > 0 ? `${item.limit - item.current} remaining` : 'Limit reached'}
                  </span>
                  <span>
                    Resets {item.resetDate.toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Upgrade to Pro for unlimited access to all features
        </p>
      </div>
    </div>
  )
}

export default UsageDisplay
