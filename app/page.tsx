'use client'

import { useEffect, useState } from 'react'
import Header from '../components/Header'
import RaceStrategyForm from '../components/RaceStrategyForm'
import SimulationResultsModal from '../components/SimulationResultsModal'
import StrategyRecommendations from '../components/StrategyRecommendations'
import TrackSelector from '../components/TrackSelector'
import WeatherForecast from '../components/WeatherForecast'
import StrategyComparison from '../components/StrategyComparison'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginModal from '../components/LoginModal'
import { useSimulationStore } from '../store/simulationStore'
import { useSession } from 'next-auth/react'
import { Crown } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false)
  const { data: session, status } = useSession()
  const {
    loadAvailableTracks,
    loadWeatherForecast,
    selectedTrack,
    isUsingAPIData,
    apiError,
    refreshAPIData,
    simulationResults,
    totalTime,
    strategyAnalysis,
    isLoading
  } = useSimulationStore()

  useEffect(() => {
    loadAvailableTracks()
  }, [loadAvailableTracks])

  useEffect(() => {
    if (selectedTrack) {
      loadWeatherForecast(selectedTrack)
    }
  }, [selectedTrack, loadWeatherForecast])

  // Auto-open login modal if user is not authenticated and not loading
  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginModalOpen) {
      setIsLoginModalOpen(true)
    }
  }, [status, isLoginModalOpen])

  const handleOpenLogin = () => setIsLoginModalOpen(true)
  const handleCloseLogin = () => setIsLoginModalOpen(false)
  
  const handleSimulationComplete = () => {
    setIsSimulationModalOpen(true)
  }
  
  // For testing - remove this in production
  const handleTestModal = () => {
    setIsSimulationModalOpen(true)
  }
  
  const handleCloseSimulationModal = () => {
    setIsSimulationModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onOpenLogin={handleOpenLogin} />
      
      {/* Pricing Banner for Free Users */}
      {!session?.user && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700/30 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Unlock Premium Features</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Get unlimited simulations, advanced analytics, and more</p>
              </div>
            </div>
            <Link href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      )}
      
      {/* API Error Banner */}
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
          <div className="lg:col-span-3 space-y-6">
            <TrackSelector />
            <WeatherForecast />
          </div>

          <div className="lg:col-span-2 space-y-6 max-w-xl mx-auto">
            {session?.user ? (
              <>
                <RaceStrategyForm onSimulationComplete={handleSimulationComplete} />
                <StrategyRecommendations />
              </>
            ) : (
              <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                </div>
                
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-4">
                    Sign in to Access Features
                  </h3>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Create race strategies and get AI recommendations
                  </p>
                  
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleOpenLogin}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </button>
                    <button
                      onClick={handleTestModal}
                      className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm"
                    >
                      Test Results Modal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Results Modal */}
        <SimulationResultsModal
          isOpen={isSimulationModalOpen}
          onClose={handleCloseSimulationModal}
          results={simulationResults?.[simulationResults.length - 1] || null}
          totalTime={totalTime}
          strategyAnalysis={strategyAnalysis}
          weather="dry"
          isLoading={isLoading}
        />

        <div className="mt-8">
          {session?.user ? (
            <StrategyComparison />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Strategy Comparison
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to compare different race strategies
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-300 gap-2">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <span className="font-medium text-gray-900 dark:text-gray-100">F1 Race Simulator</span>
              <span className="text-gray-500 dark:text-gray-400">Professional racing strategy analysis</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/kirandevihosur74/F1RaceSim" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">GitHub</a>
              <span className="text-gray-400 dark:text-gray-500">&copy; {new Date().getFullYear()} F1 Race Sim</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleCloseLogin} 
      />
    </div>
  )
} 