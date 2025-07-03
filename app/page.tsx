'use client'

import React from 'react'
import Header from '@/components/Header'
import RaceStrategyForm from '@/components/RaceStrategyForm'
import SimulationResultsChart from '@/components/SimulationResultsChart'
import StrategyRecommendations from '@/components/StrategyRecommendations'
import { useSimulationStore } from '@/store/simulationStore'

export default function Home() {
  const { simulationResults, isLoading } = useSimulationStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Strategy Form */}
          <div className="space-y-6">
            <RaceStrategyForm />
            <StrategyRecommendations />
          </div>
          
          {/* Right Column - Results */}
          <div className="space-y-6">
            <SimulationResultsChart />
            
            {isLoading && (
              <div className="card">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-f1-red"></div>
                  <span className="ml-2 text-gray-600">Simulating race...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 