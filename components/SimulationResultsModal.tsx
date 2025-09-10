import React, { useEffect, useState } from 'react'
import { X, TrendingUp, Clock, Target, Zap, BarChart3, Download, Share2 } from 'lucide-react'
import SimulationResultsChart from './SimulationResultsChart'
import { generateSimulationPDF_v2 } from '../lib/pdfGenerator'

interface SimulationResult {
  totalTime?: string
  pitStopTimes?: string[]
  tireStrategy?: string[]
  driverStyle?: string
  weatherConditions?: string
  trackConditions?: string
  lapTimes?: number[]
  fuelConsumption?: number
  position?: number
  points?: number
  // Store result fields
  lap?: number
  lap_time?: number
  tire_wear?: number
  fuel_load?: number
}

interface SimulationResultsModalProps {
  isOpen: boolean
  onClose: () => void
  results: SimulationResult | null
  totalTime?: number | null
  strategyAnalysis?: string | null
  weather?: string
  isLoading: boolean
}

const SimulationResultsModal: React.FC<SimulationResultsModalProps> = ({
  isOpen,
  onClose,
  results,
  totalTime,
  strategyAnalysis,
  weather,
  isLoading
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setAnimationPhase('entering')
      // Trigger visible animation after a short delay
      setTimeout(() => setAnimationPhase('visible'), 100)
    } else {
      setAnimationPhase('exiting')
      // Hide modal after animation completes
      setTimeout(() => {
        setIsVisible(false)
        setAnimationPhase('entering')
      }, 300)
    }
  }, [isOpen])

  if (!isVisible) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDownloadResults = async () => {
    if (!results) return
    
    try {
      // Get strategy data from the store
      const { useSimulationStore } = await import('../store/simulationStore')
      const store = useSimulationStore.getState()
      
      const pdfData = {
        totalTime,
        strategyAnalysis,
        simulationResults: store.simulationResults,
        strategy: store.strategies.find(s => s.id === store.activeStrategyId) || store.strategies[0],
        track: store.availableTracks.find(t => t.id === store.selectedTrack),
        weather: weather || 'dry'
      }
      
      await generateSimulationPDF_v2(pdfData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to JSON download
      const dataStr = JSON.stringify(results, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `simulation-results-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleShareResults = async () => {
    if (!results) return
    
    const shareData = {
      title: 'F1 Race Simulation Results',
      text: `Check out my F1 simulation results! Total time: ${results.totalTime}`,
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        animationPhase === 'entering' 
          ? 'bg-black/0 backdrop-blur-none' 
          : animationPhase === 'visible'
          ? 'bg-black/50 backdrop-blur-sm'
          : 'bg-black/0 backdrop-blur-none'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden transition-all duration-500 transform ${
          animationPhase === 'entering'
            ? 'scale-95 opacity-0 translate-y-8'
            : animationPhase === 'visible'
            ? 'scale-100 opacity-100 translate-y-0'
            : 'scale-95 opacity-0 translate-y-8'
        }`}
      >
        {/* Modal Content */}
        <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-blue-500 to-green-500"></div>
          </div>

          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-500 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Simulation Results</h2>
                  <p className="text-white/80 text-sm">Race strategy performance analysis</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShareResults}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  title="Share Results"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownloadResults}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  title="Download PDF Report"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin border-t-red-500"></div>
                  <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-spin border-t-blue-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-2">
                  Running Simulation...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Analyzing your race strategy and calculating optimal performance metrics
                </p>
                <div className="mt-4 flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            ) : results ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Race Time</h3>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {totalTime ? `${(totalTime / 60).toFixed(1)}m` : results.lap_time ? `${results.lap_time.toFixed(3)}s` : '1:23.456'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Position</h3>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {results.position ? `#${results.position}` : 'Single Car'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">Tire Wear</h3>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {results.tire_wear ? `${results.tire_wear.toFixed(1)}%` : '85.2%'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Strategy Analysis
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Pit Stops:</span>
                        <p className="text-gray-900 dark:text-gray-100">{results.pitStopTimes?.join(', ') || 'Lap 15, Lap 35'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tire Strategy:</span>
                        <p className="text-gray-900 dark:text-gray-100">{results.tireStrategy?.join(' → ') || 'Medium → Hard → Medium'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Driver Style:</span>
                        <p className="text-gray-900 dark:text-gray-100 capitalize">{results.driverStyle || 'Balanced'}</p>
                      </div>
                      {strategyAnalysis && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Analysis:</span>
                          <p className="text-gray-900 dark:text-gray-100 text-sm mt-1">{strategyAnalysis}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                      Performance Metrics
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Weather:</span>
                        <p className="text-gray-900 dark:text-gray-100">{results.weatherConditions || 'Clear, 22°C'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Track:</span>
                        <p className="text-gray-900 dark:text-gray-100">{results.trackConditions || 'Dry, Optimal'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fuel Load:</span>
                        <p className="text-gray-900 dark:text-gray-100">{results.fuel_load ? `${results.fuel_load.toFixed(1)}L` : '45.2L'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lap Times Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Lap Times Analysis
                  </h3>
                  <div id="simulation-chart">
                    <SimulationResultsChart showCard={false} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No Results Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                  Run a simulation to see detailed results and performance analysis
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {results && (
            <div className="relative bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simulation completed at {new Date().toLocaleTimeString()}
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimulationResultsModal
