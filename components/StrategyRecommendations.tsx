import React, { useEffect } from 'react'
import { Brain, Lightbulb, TrendingUp } from 'lucide-react'
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
  
  const strategy = strategies.find(s => s.id === activeStrategyId) || strategies[0]

  const handleGetRecommendation = () => {
    if (strategy && strategy.pit_stops.length > 0 && strategy.tires.length > 0) {
      const scenario = `Pit stops at laps ${strategy.pit_stops.join(', ')}, using ${strategy.tires.join(' → ')}, driver style: ${strategy.driver_style}`
      getStrategyRecommendation(scenario)
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
        <Brain className="w-6 h-6 text-f1-blue" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Strategy Recommendations</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-f1-blue"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-300">Analyzing strategy...</span>
        </div>
      ) : recommendations ? (
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
          
          <div className="text-center mt-4">
            <button
              onClick={handleGetRecommendation}
              className="bg-f1-blue hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Refresh AI Recommendation
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">Configure your strategy to get AI recommendations</p>
          <button
            onClick={handleGetRecommendation}
            disabled={strategy.pit_stops.length === 0 || strategy.tires.length === 0}
            className="bg-f1-blue hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Get AI Strategy Recommendation
          </button>
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        * Please minimize API requests as there is a rate limit for demo purposes.
      </p>
    </div>
  )
}

export default StrategyRecommendations 