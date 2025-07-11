import React, { useState } from 'react'
import { BarChart3, Trophy, AlertTriangle, TrendingUp, Clock, Target, Plus } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'
import toast from 'react-hot-toast';

const StrategyComparison: React.FC = () => {
  const { 
    strategies, 
    comparisonResults, 
    compareStrategies, 
    isLoading, 
    deleteStrategy, 
    setActiveStrategy, 
    addStrategy,
    activeStrategyId,
    resetComparisonResults
  } = useSimulationStore()

  const handleCompareStrategies = () => {
    compareStrategies(strategies)
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 0.3) return 'text-green-600'
    if (riskScore < 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskLevel = (riskScore: number) => {
    if (riskScore < 0.3) return 'Low'
    if (riskScore < 0.6) return 'Medium'
    return 'High'
  }

  if (!comparisonResults) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Strategy Comparison</h2>
          <button
            onClick={() => {
              const newStrategy = {
                name: `Strategy ${strategies.length + 1}`,
                pit_stops: [15, 35],
                tires: ['Medium', 'Hard', 'Medium'],
                driver_style: 'balanced' as const
              }
              addStrategy(newStrategy)
              setActiveStrategy(`strategy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`)
            }}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Strategy</span>
          </button>
        </div>
        
        {strategies.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Add strategies to compare.</p>
            <button
              onClick={() => {
                const newStrategy = {
                  name: `Strategy 1`,
                  pit_stops: [15, 35],
                  tires: ['Medium', 'Hard', 'Medium'],
                  driver_style: 'balanced' as const
                }
                addStrategy(newStrategy)
                setActiveStrategy(`strategy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`)
              }}
              className="btn-primary flex items-center space-x-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>New Strategy</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`p-4 border rounded-lg flex flex-col gap-2 cursor-pointer hover:shadow-lg transition ${
                  strategy.id === activeStrategyId 
                    ? 'border-blue-300 bg-blue-50 dark:bg-[#232b39]' 
                    : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                }`}
                onClick={() => setActiveStrategy(strategy.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{strategy.name}</h3>
                    {strategy.id === activeStrategyId && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">Editing</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteStrategy(strategy.id);
                        toast.success(`${strategy.name} deleted successfully`);
                      }}
                      className="text-red-600 hover:underline text-xs dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Pit Stops:</span>
                    <span className="ml-2 font-medium dark:text-gray-100">{strategy.pit_stops.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Tires:</span>
                    <span className="ml-2 font-medium dark:text-gray-100">{strategy.tires.join(' → ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Style:</span>
                    <span className="ml-2 font-medium capitalize dark:text-gray-100">{strategy.driver_style}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={handleCompareStrategies}
          disabled={isLoading || strategies.length < 2}
          className="btn-primary w-full mt-6 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <BarChart3 className="w-5 h-5" />
          <span>
            {isLoading ? 'Comparing...' : 
             strategies.length < 2 ? 'Need at least 2 strategies' : 
             'Compare Strategies'}
          </span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          * Please minimize API requests as there is a rate limit for demo purposes.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Strategy Comparison Results</h2>
      
      {/* Winner */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/40 dark:to-yellow-900/40 p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-200" />
          <div>
            <h3 className="font-bold text-yellow-900 dark:text-yellow-200">Winner: {comparisonResults.winner.name}</h3>
            <p className="text-yellow-700 dark:text-yellow-100">Total Time: {comparisonResults.winner.total_time.toFixed(1)}s</p>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full dark:bg-gray-800">
          <thead className="dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-900 dark:text-gray-100">Strategy</th>
              <th className="text-center py-2 text-gray-900 dark:text-gray-100">Total Time</th>
              <th className="text-center py-2 text-gray-900 dark:text-gray-100">Best Lap</th>
              <th className="text-center py-2 text-gray-900 dark:text-gray-100">Avg Lap</th>
              <th className="text-center py-2 text-gray-900 dark:text-gray-100">Risk Level</th>
              <th className="text-center py-2 text-gray-900 dark:text-gray-100">Tire Wear</th>
            </tr>
          </thead>
          <tbody>
            {comparisonResults.strategies.map((strategy, index) => (
              <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{strategy.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {strategy.tires.join(' → ')} | {strategy.pit_stops.join(', ')}
                  </div>
                </td>
                <td className="text-center py-3 font-mono text-gray-900 dark:text-gray-100">
                  {strategy.total_time.toFixed(1)}s
                </td>
                <td className="text-center py-3 font-mono text-gray-900 dark:text-gray-100">
                  {strategy.best_lap.toFixed(1)}s
                </td>
                <td className="text-center py-3 font-mono text-gray-900 dark:text-gray-100">
                  {strategy.average_lap.toFixed(1)}s
                </td>
                <td className="text-center py-3">
                  <span className={`font-medium ${getRiskColor(strategy.risk_score)}`}>{getRiskLevel(strategy.risk_score)}</span>
                </td>
                <td className="text-center py-3">
                  <span className={`text-sm ${
                    strategy.tire_wear_analysis.overall_wear_risk === 'high' ? 'text-red-600' :
                    strategy.tire_wear_analysis.overall_wear_risk === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {strategy.tire_wear_analysis.overall_wear_risk.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key Differences */}
      {comparisonResults.key_differences.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Key Differences</span>
          </h3>
          <div className="space-y-2">
            {comparisonResults.key_differences.map((difference, index) => (
              <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-orange-800">{difference.description}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    difference.impact === 'high' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {difference.impact.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Suggestions */}
      {comparisonResults.optimization_suggestions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <span>Optimization Suggestions</span>
          </h3>
          <div className="space-y-2">
            {comparisonResults.optimization_suggestions.map((suggestion, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-800">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Analysis */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
          <Target className="w-5 h-5 text-purple-500" />
          <span>Risk Analysis</span>
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/40 p-3 rounded-lg">
            <div className="text-sm text-red-700 dark:text-red-200">High Risk</div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {comparisonResults.risk_analysis.high_risk_strategies}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/40 p-3 rounded-lg">
            <div className="text-sm text-yellow-700 dark:text-yellow-200">Medium Risk</div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {comparisonResults.risk_analysis.medium_risk_strategies}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/40 p-3 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-200">Low Risk</div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {comparisonResults.risk_analysis.low_risk_strategies}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/40 p-3 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-200">Avg Risk</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {(comparisonResults.risk_analysis.average_risk * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Compare Again Button */}
      <button
        onClick={handleCompareStrategies}
        disabled={isLoading}
        className="btn-primary w-full mt-6 flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        <BarChart3 className="w-5 h-5" />
        <span>{isLoading ? 'Comparing...' : 'Compare Again'}</span>
      </button>

      {/* Reset Comparison Button */}
      <button
        onClick={resetComparisonResults}
        className="btn-secondary w-full mt-4"
      >
        Reset Comparison
      </button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        * Please minimize API requests as there is a rate limit for demo purposes.
      </p>
    </div>
  )
}

export default StrategyComparison 