import React from 'react'
import { useUsage } from '../lib/hooks/useUsage'
import { AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const UsageDisplay = () => {
  const { usage, loading, error } = useUsage()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Error loading usage: {error}</span>
        </div>
      </div>
    )
  }

  if (!usage || usage.length === 0) {
    return null
  }

  const simulationUsage = usage.find(u => u.feature === 'simulations')
  const aiUsage = usage.find(u => u.feature === 'ai_recommendations')
  const strategyUsage = usage.find(u => u.feature === 'strategies')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Your Usage
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Simulations */}
        {simulationUsage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Simulations
              </span>
              {simulationUsage.limit !== -1 && (
                <span className="text-xs text-blue-600 dark:text-blue-300">
                  Daily
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {simulationUsage.current}
              {simulationUsage.limit !== -1 && (
                <span className="text-lg text-blue-600 dark:text-blue-300">
                  /{simulationUsage.limit}
                </span>
              )}
            </div>
            {simulationUsage.current >= simulationUsage.limit && simulationUsage.limit !== -1 && (
              <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-block mt-1 text-orange-800 dark:text-orange-200 underline hover:no-underline"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations */}
        {aiUsage && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                AI Recommendations
              </span>
              {aiUsage.limit !== -1 && (
                <span className="text-xs text-purple-600 dark:text-purple-300">
                  Monthly
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {aiUsage.current}
              {aiUsage.limit !== -1 && (
                <span className="text-lg text-purple-600 dark:text-purple-300">
                  /{aiUsage.limit}
                </span>
              )}
            </div>
            {aiUsage.current >= aiUsage.limit && aiUsage.limit !== -1 && (
              <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-block mt-1 text-orange-800 dark:text-orange-200 underline hover:no-underline"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Strategies */}
        {strategyUsage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Strategies
              </span>
              {strategyUsage.limit !== -1 && (
                <span className="text-xs text-green-600 dark:text-green-300">
                  Total
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {strategyUsage.current}
              {strategyUsage.limit !== -1 && (
                <span className="text-lg text-green-600 dark:text-green-300">
                  /{strategyUsage.limit}
                </span>
              )}
            </div>
            {strategyUsage.current >= strategyUsage.limit && strategyUsage.limit !== -1 && (
              <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-700 dark:text-orange-300">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-block mt-1 text-orange-800 dark:text-orange-200 underline hover:no-underline"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Need more features?
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Upgrade to Pro for unlimited simulations and advanced features
            </p>
          </div>
          <Link 
            href="/pricing" 
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>View Plans</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UsageDisplay
