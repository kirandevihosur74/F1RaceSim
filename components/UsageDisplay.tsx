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
    <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 mb-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500"></div>
      </div>
      
      <div className="relative">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Your Usage
        </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simulations */}
        {simulationUsage && (
          <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Simulations
                </span>
              </div>
              {simulationUsage.limit !== -1 && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                  Daily
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              {simulationUsage.current}
              {simulationUsage.limit !== -1 && (
                <span className="text-xl text-blue-600 dark:text-blue-300">
                  /{simulationUsage.limit}
                </span>
              )}
            </div>
            {simulationUsage.current >= simulationUsage.limit && simulationUsage.limit !== -1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200 dark:border-orange-700">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center text-sm font-medium text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                >
                  Upgrade to Pro
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations */}
        {aiUsage && (
          <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  AI Recommendations
                </span>
              </div>
              {aiUsage.limit !== -1 && (
                <span className="text-xs font-medium text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded-full">
                  Daily
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {aiUsage.current}
              {aiUsage.limit !== -1 && (
                <span className="text-xl text-purple-600 dark:text-purple-300">
                  /{aiUsage.limit}
                </span>
              )}
            </div>
            {aiUsage.current >= aiUsage.limit && aiUsage.limit !== -1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200 dark:border-orange-700">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center text-sm font-medium text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                >
                  Upgrade to Pro
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Strategies */}
        {strategyUsage && (
          <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Strategies
                </span>
              </div>
              {strategyUsage.limit !== -1 && (
                <span className="text-xs font-medium text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                  Total
                </span>
              )}
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
              {strategyUsage.current}
              {strategyUsage.limit !== -1 && (
                <span className="text-xl text-green-600 dark:text-green-300">
                  /{strategyUsage.limit}
                </span>
              )}
            </div>
            {strategyUsage.current >= strategyUsage.limit && strategyUsage.limit !== -1 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl border border-orange-200 dark:border-orange-700">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Limit reached</span>
                </div>
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center text-sm font-medium text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                >
                  Upgrade to Pro
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100">
              Need more features?
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Upgrade to Pro for unlimited simulations and advanced features
            </p>
          </div>
          <Link 
            href="/pricing" 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>View Plans</span>
          </Link>
        </div>
      </div>
    </div>
    </div>
  )
}

export default UsageDisplay
