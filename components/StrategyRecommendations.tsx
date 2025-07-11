import React, { useEffect } from 'react'
import { Brain, Lightbulb, TrendingUp } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'

const StrategyRecommendations: React.FC = () => {
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
          <span className="ml-2 text-gray-600">Analyzing strategy...</span>
        </div>
      ) : recommendations ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">AI Analysis</h3>
                {typeof recommendations === 'object' ? (
                  <div>
                    <h4 className="font-bold mt-2">Pit Stop Timing</h4>
                    <p>{recommendations.pit_stop_timing}</p>
                    <h4 className="font-bold mt-2">Tire Compound Strategy</h4>
                    <p>{recommendations.tire_compound_strategy}</p>
                    <h4 className="font-bold mt-2">Driver Approach Adjustments</h4>
                    <p>{recommendations.driver_approach_adjustments}</p>
                    <h4 className="font-bold mt-2">Potential Time Savings/Risks</h4>
                    <p>{recommendations.potential_time_savings_or_risks}</p>
                  </div>
                ) : (
                  <p>{recommendations}</p>
                )}
              </div>
            </div>
          </div>
          {/* Refresh Recommendation Button */}
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
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">Configure your strategy to get AI recommendations</p>
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