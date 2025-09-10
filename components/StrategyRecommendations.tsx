import React, { useEffect, useState } from 'react'
import { Brain, Lightbulb, TrendingUp, AlertCircle, Sparkles, Target } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'

const StrategyRecommendations = () => {
  const { 
    strategies, 
    activeStrategyId, 
    recommendations, 
    getStrategyRecommendation, 
    isLoading, 
    addStrategy, 
    setActiveStrategy
  } = useSimulationStore()
  
  const [error, setError] = useState<string | null>(null)
  
  const strategy = strategies.find(s => s.id === activeStrategyId) || strategies[0]

  const handleGetRecommendation = async () => {
    if (strategy && strategy.pit_stops.length > 0 && strategy.tires.length > 0) {
      setError(null) // Clear any previous errors
      const scenario = `Pit stops at laps ${strategy.pit_stops.join(', ')}, using ${strategy.tires.join(' → ')}, driver style: ${strategy.driver_style}`
      
      try {
        await getStrategyRecommendation(scenario)
      } catch (err: any) {
        setError(err.message || 'Failed to get strategy recommendation')
        // Clear old recommendations when there's an error
        useSimulationStore.getState().clearRecommendations?.()
      }
    }
  }

  const handleNewStrategy = () => {
    const newStrategy = {
      name: `Strategy ${strategies.length + 1}`,
      pit_stops: [15, 35],
      tires: ['Medium', 'Hard', 'Medium'],
      driver_style: 'balanced' as const
    }
    addStrategy(newStrategy)
    setActiveStrategy(`strategy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`)
  }

  // Clear error when strategy changes
  useEffect(() => {
    setError(null)
  }, [activeStrategyId])

  if (!strategy) {
    return (
      <div className="card flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 mb-4">Add strategies to compare.</p>
        <button
          onClick={handleNewStrategy}
          className="btn-primary flex items-center space-x-2"
        >
          <span>New Strategy</span>
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Strategy Recommendations</h2>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Error</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              {error.includes('Rate limit exceeded') && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  Please try again tomorrow or upgrade your plan for unlimited recommendations.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-f1-blue"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Analyzing strategy...</span>
        </div>
      ) : recommendations && !error ? (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">AI Analysis</h3>
                {typeof recommendations === 'object' ? (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">Pit Stop Timing</h4>
                      <p className="text-blue-700 dark:text-blue-300">{recommendations.pit_stop_timing}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">Tire Compound Strategy</h4>
                      <p className="text-blue-700 dark:text-blue-300">{recommendations.tire_compound_strategy}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">Driver Approach Adjustments</h4>
                      <p className="text-blue-700 dark:text-blue-300">{recommendations.driver_approach_adjustments}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 dark:text-blue-200">Potential Time Savings/Risks</h4>
                      <p className="text-blue-700 dark:text-blue-300">{recommendations.potential_time_savings_or_risks}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-blue-700 dark:text-blue-300">{recommendations}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={handleGetRecommendation}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Refresh Recommendation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">Configure your strategy to get AI-powered recommendations</p>
          <button
            onClick={handleGetRecommendation}
            disabled={strategy.pit_stops.length === 0 || strategy.tires.length === 0}
            className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="w-5 h-5" />
            <span>Get Strategy Recommendation</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default StrategyRecommendations 