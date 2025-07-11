'use client'

import { useEffect } from 'react'
import Header from '../components/Header'
import RaceStrategyForm from '../components/RaceStrategyForm'
import SimulationResultsChart from '../components/SimulationResultsChart'
import StrategyRecommendations from '../components/StrategyRecommendations'
import TrackSelector from '../components/TrackSelector'
import WeatherForecast from '../components/WeatherForecast'
import StrategyComparison from '../components/StrategyComparison'
import { useSimulationStore } from '../store/simulationStore'

export default function Home() {
  const {
    loadAvailableTracks,
    loadWeatherForecast,
    selectedTrack,
    isUsingAPIData,
    apiError,
    refreshAPIData
  } = useSimulationStore()

  useEffect(() => {
    // Load initial data
    loadAvailableTracks()
  }, [loadAvailableTracks])

  useEffect(() => {
    // Load weather forecast when track changes
    if (selectedTrack) {
      loadWeatherForecast(selectedTrack)
    }
  }, [selectedTrack, loadWeatherForecast])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* API Status Banner */}
      {apiError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-800">{apiError}</span>
            </div>
            <button
              onClick={refreshAPIData}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              Retry API
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Track Selection & Weather - much wider */}
          <div className="lg:col-span-3 space-y-6">
            <TrackSelector />
            <WeatherForecast />
          </div>

          {/* Strategy Form & Recommendations - narrower */}
          <div className="lg:col-span-2 space-y-6 max-w-xl mx-auto">
            <RaceStrategyForm />
            <StrategyRecommendations />
          </div>
        </div>

        {/* Full Width - Simulation Results */}
        <div className="mt-8">
          <SimulationResultsChart />
        </div>

        {/* Full Width - Strategy Comparison */}
        <div className="mt-8">
          <StrategyComparison />
        </div>
      </main>

      {/* Custom Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-300 gap-2">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span className="font-semibold text-f1-red">F1 Race Sim: Smarter Strategy, Better Racing</span>
              <span className="italic text-gray-500 dark:text-gray-400">Built for F1 fans & data-driven strategists</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/kirandevihosur74/F1RaceSim" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">View on GitHub</a>
              <span className="text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} F1 Race Sim</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 