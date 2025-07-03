import { create } from 'zustand'
import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface StrategyInput {
  pit_stops: number[]
  tires: string[]
  driver_style: 'aggressive' | 'balanced' | 'conservative'
}

export interface SimulationResult {
  lap: number
  lap_time: number
  tire_wear: number
  position?: number
  fuel_load?: number
}

export interface SimulationResponse {
  status: string
  simulation: SimulationResult[]
  total_time?: number
  strategy_analysis?: string
}

interface SimulationStore {
  strategyInput: StrategyInput
  simulationResults: SimulationResponse | null
  isLoading: boolean
  error: string | null
  recommendations: string | null
  
  // Actions
  setStrategyInput: (input: Partial<StrategyInput>) => void
  runSimulation: (weather?: string) => Promise<void>
  getStrategyRecommendation: (scenario: string) => Promise<void>
  resetSimulation: () => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  strategyInput: {
    pit_stops: [15, 35],
    tires: ['Medium', 'Hard', 'Soft'],
    driver_style: 'balanced'
  },
  simulationResults: null,
  isLoading: false,
  error: null,
  recommendations: null,

  setStrategyInput: (input) => {
    set((state) => ({
      strategyInput: { ...state.strategyInput, ...input }
    }))
  },

  runSimulation: async (weather = 'dry') => {
    set({ isLoading: true, error: null })
    
    try {
      const { strategyInput } = get()
      const response = await axios.post(`${API_BASE_URL}/simulate-race`, {
        strategy: strategyInput,
        weather
      })
      
      set({ 
        simulationResults: response.data,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Simulation failed',
        isLoading: false 
      })
    }
  },

  getStrategyRecommendation: async (scenario: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/strategy-recommendation`, {
        scenario
      })
      
      set({ recommendations: response.data.recommendation })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get recommendations'
      })
    }
  },

  resetSimulation: () => {
    set({
      simulationResults: null,
      error: null,
      recommendations: null
    })
  }
})) 