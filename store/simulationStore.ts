import { create } from 'zustand'
import { F1APIService } from '../lib/f1-api'

export interface StrategyInput {
  pit_stops: number[]
  tires: string[]
  driver_style: 'conservative' | 'balanced' | 'aggressive'
}

// Add a meta type for strategies
export interface StrategyInputWithMeta extends StrategyInput {
  id: string
  name: string
}

export interface SimulationResult {
  lap: number
  lap_time: number
  tire_wear: number
  position: number
  fuel_load: number
}

export interface MultiCarSimulationResult {
  lap: number
  cars: CarResult[]
  overtaking_events: OvertakingEvent[]
}

export interface CarResult {
  car_id: string
  driver_name: string
  position: number
  lap_time: number
  total_time: number
  tire_wear: number
  current_tire: string
  fuel_load: number
  sector_times: number[]
  gap_to_leader: number
  gap_to_car_ahead: number
  is_pitting: boolean
}

export interface OvertakingEvent {
  lap: number
  overtaking_car: string
  overtaken_car: string
  position_change: number
  gap_before: number
  gap_after: number
}

export interface TrackData {
  id: string
  name: string
  country: string
  circuit_length: number
  total_laps: number
  lap_record: number
  sectors: TrackSector[]
  tire_degradation: Record<string, number>
  weather_sensitivity: number
  overtaking_difficulty: number
}

export interface TrackSector {
  name: string
  length: number
  base_time: number
  tire_wear_factor: number
  fuel_consumption_factor: number
}

export interface WeatherForecast {
  lap: number
  condition: string
  temperature: number
  humidity: number
  wind_speed: number
  rain_probability: number
  track_temperature: number
  grip_level: number
}

export interface StrategyComparison {
  name: string
  total_time: number
  pit_stops: number[]
  tires: string[]
  driver_style: string
  best_lap: number
  average_lap: number
  risk_score: number
  tire_wear_analysis: any
  weather_impact: any
}

export interface ComparisonResult {
  strategies: StrategyComparison[]
  winner: {
    name: string
    total_time: number
  }
  key_differences: any[]
  optimization_suggestions: string[]
  risk_analysis: any
}

interface SimulationStore {
  // Basic simulation state
  strategies: StrategyInputWithMeta[]
  activeStrategyId: string | null
  simulationResults: SimulationResult[]
  multiCarResults: MultiCarSimulationResult[]
  recommendations: any
  isLoading: boolean
  totalTime: number | null
  strategyAnalysis: string | null
  
  // New features state
  selectedTrack: string
  availableTracks: TrackData[]
  weatherForecast: WeatherForecast[]
  comparisonResults: ComparisonResult | null
  
  // API state
  isUsingAPIData: boolean
  apiError: string | null
  
  // Actions
  addStrategy: (strategy: Omit<StrategyInputWithMeta, 'id'>) => void
  editStrategy: (id: string, updates: Partial<StrategyInputWithMeta>) => void
  deleteStrategy: (id: string) => void
  setActiveStrategy: (id: string | null) => void
  runSimulation: (weather?: string) => Promise<void>
  runMultiCarSimulation: (carConfigs: any[], weather?: string) => Promise<void>
  getStrategyRecommendation: (scenario: string) => Promise<void>
  
  // New feature actions
  setSelectedTrack: (trackId: string) => void
  loadAvailableTracks: () => Promise<void>
  loadTrackDetails: (trackId: string) => Promise<TrackData>
  loadWeatherForecast: (trackId: string) => Promise<void>
  compareStrategies: (strategies: any[], weather?: string) => Promise<void>
  
  // API actions
  refreshAPIData: () => Promise<void>
  toggleAPIData: () => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  strategies: [
    {
      id: 'default-1',
      name: '', // Start with empty name
      pit_stops: [15, 35],
      tires: ['Medium', 'Hard', 'Medium'],
      driver_style: 'balanced'
    }
  ],
  activeStrategyId: null,
  simulationResults: [],
  multiCarResults: [],
  recommendations: null,
  isLoading: false,
  totalTime: null,
  strategyAnalysis: null,
  
  // New features initial state
  selectedTrack: 'silverstone',
  availableTracks: [],
  weatherForecast: [],
  comparisonResults: null,
  
  // API state
  isUsingAPIData: true,
  apiError: null,

  // Basic actions
  addStrategy: (strategy) => {
    const id = `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    set((state) => ({
      strategies: [...state.strategies, { ...strategy, id }],
      activeStrategyId: id, // Set the new strategy as active
    }));
  },
  editStrategy: (id, updates) => {
    set((state) => ({
      strategies: state.strategies.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  },
  deleteStrategy: (id) => {
    set((state) => {
      const newStrategies = state.strategies.filter(s => s.id !== id)
      return {
        strategies: newStrategies,
        activeStrategyId: newStrategies.length > 0 ? newStrategies[0].id : null
      }
    })
  },
  setActiveStrategy: (id) => {
    set({ activeStrategyId: id });
  },

  runSimulation: async (weather = 'dry') => {
    set({ isLoading: true })
    
    try {
      const { strategies, activeStrategyId, selectedTrack } = get()
      const strategy = strategies.find(s => s.id === activeStrategyId) || strategies[0]
      
      const response = await fetch('/api/simulate-race', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy,
          weather,
          track_id: selectedTrack,
          simulation_type: 'single_car'
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Rate limit exceeded: You have reached the maximum number of simulations allowed today.')
      }

      if (!response.ok) {
        throw new Error('Failed to run simulation')
      }

      const data = await response.json()
      set({ 
        simulationResults: data.simulation,
        totalTime: data.total_time,
        strategyAnalysis: data.strategy_analysis,
        isLoading: false 
      })
    } catch (error) {
      console.error('Simulation error:', error)
      set({ isLoading: false })
      throw error // Re-throw so the component can handle it
    }
  },

  runMultiCarSimulation: async (carConfigs, weather = 'dry') => {
    set({ isLoading: true })
    
    try {
      const { selectedTrack } = get()
      
      const response = await fetch('/api/simulate-race', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          car_configs: carConfigs,
          weather,
          track_id: selectedTrack,
          simulation_type: 'multi_car'
        }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        let msg = errorData.error || 'Rate limit exceeded: You have reached the maximum number of simulations allowed today.';
        if (
          msg.includes('Rate limit exceeded') &&
          msg.includes('per 1 day')
        ) {
          msg = 'Rate limit exceeded: You have reached the maximum number of simulations allowed today.';
        }
        throw new Error(msg)
      }

      if (!response.ok) {
        throw new Error('Failed to run multi-car simulation')
      }

      const data = await response.json()
      set({ 
        multiCarResults: data.simulation,
        isLoading: false 
      })
    } catch (error) {
      console.error('Multi-car simulation error:', error)
      set({ isLoading: false })
      throw error // Re-throw so the component can handle it
    }
  },

  getStrategyRecommendation: async (scenario) => {
    set({ isLoading: true })
    
    try {
      const response = await fetch('/api/strategy-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario }),
      })

      if (response.status === 429) {
        const errorData = await response.json()
        let msg = errorData.error || 'Rate limit exceeded: You have reached the maximum number of strategy recommendations allowed today.';
        if (
          msg.includes('Rate limit exceeded') &&
          msg.includes('per 1 day')
        ) {
          msg = 'Rate limit exceeded: You have reached the maximum number of strategy recommendations allowed today.';
        }
        throw new Error(msg)
      }

      if (!response.ok) {
        throw new Error('Failed to get strategy recommendation')
      }

      const data = await response.json()
      set({ 
        recommendations: data.recommendation,
        isLoading: false 
      })
    } catch (error) {
      console.error('Strategy recommendation error:', error)
      set({ isLoading: false })
      throw error // Re-throw so the component can handle it
    }
  },

  // New feature actions
  setSelectedTrack: (trackId) => {
    set({ selectedTrack: trackId })
  },

  loadAvailableTracks: async () => {
    set({ isLoading: true, apiError: null })
    
    try {
      const { isUsingAPIData } = get()
      
      if (isUsingAPIData) {
        // Try to get tracks from API first
        const tracks = await F1APIService.getAllTracks()
        set({ 
          availableTracks: tracks,
          isLoading: false,
          isUsingAPIData: true
        })
      } else {
        // Use local data only
        const localTracks = await F1APIService.getAllTracks()
        set({ 
          availableTracks: localTracks,
          isLoading: false,
          isUsingAPIData: false
        })
      }
    } catch (error) {
      console.error('Load tracks error:', error)
      set({ 
        apiError: 'Failed to load tracks from API, using local data',
        isLoading: false,
        isUsingAPIData: false
      })
      
      // Fallback to local data
      try {
        const localTracks = await F1APIService.getAllTracks()
        set({ availableTracks: localTracks })
      } catch (fallbackError) {
        console.error('Fallback to local data failed:', fallbackError)
        set({ apiError: 'Failed to load tracks' })
      }
    }
  },

  loadTrackDetails: async (trackId) => {
    try {
      const { isUsingAPIData } = get()
      
      if (isUsingAPIData) {
        // Try to get from API first
        const trackData = await F1APIService.getTrackData(trackId)
        if (trackData) {
          return trackData
        }
      }
      
      // Fallback to local data
      const trackData = await F1APIService.getTrackData(trackId)
      return trackData
    } catch (error) {
      console.error('Load track details error:', error)
      throw error
    }
  },

  loadWeatherForecast: async (trackId) => {
    try {
      const { isUsingAPIData } = get()
      
      if (isUsingAPIData) {
        // Try to get real weather data
        const realWeather = await F1APIService.getWeatherData(trackId)
        if (realWeather) {
          // Generate forecast based on real weather
          const forecast = generateWeatherForecastFromRealData(realWeather, trackId)
          set({ weatherForecast: forecast })
          return
        }
      }
      
      // Fallback to simulated weather
      const forecast = generateSimulatedWeatherForecast(trackId)
      set({ weatherForecast: forecast })
    } catch (error) {
      console.error('Load weather forecast error:', error)
      // Use simulated weather as fallback
      const forecast = generateSimulatedWeatherForecast(trackId)
      set({ weatherForecast: forecast })
    }
  },

  compareStrategies: async (strategies, weather = 'dry') => {
    set({ isLoading: true })
    
    try {
      const { selectedTrack } = get()
      
      const response = await fetch('/api/strategy-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategies,
          weather,
          track_id: selectedTrack,
          num_simulations: 5
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to compare strategies')
      }

      const data = await response.json()
      set({ 
        comparisonResults: data.comparison,
        isLoading: false 
      })
    } catch (error) {
      console.error('Strategy comparison error:', error)
      set({ isLoading: false })
    }
  },

  // API actions
  refreshAPIData: async () => {
    set({ isLoading: true, apiError: null })
    
    try {
      // Test Jolpi API connectivity
      const connectivityTest = await F1APIService.testAPIConnectivity()
      
      if (connectivityTest.available) {
        set({ 
          isUsingAPIData: true,
          apiError: null,
          isLoading: false
        })
        // Reload tracks with API data
        await get().loadAvailableTracks()
      } else {
        throw new Error(connectivityTest.error || 'Jolpi API unavailable')
      }
    } catch (error) {
      console.error('API refresh failed:', error)
      set({ 
        isUsingAPIData: false,
        apiError: 'Jolpi API is unavailable. Using local data only.',
        isLoading: false
      })
    }
  },

  toggleAPIData: () => {
    const { isUsingAPIData } = get()
    set({ isUsingAPIData: !isUsingAPIData })
    // Reload tracks with new setting
    get().loadAvailableTracks()
  }
}))

// Helper functions for weather forecast generation
function generateWeatherForecastFromRealData(realWeather: any, trackId: string): WeatherForecast[] {
  const forecast: WeatherForecast[] = []
  const totalLaps = 50 // Default, would get from track data
  
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Use real weather as base and add some variation
    const variation = (Math.random() - 0.5) * 0.2
    const temperature = realWeather.temperature + variation * 5
    const humidity = Math.max(30, Math.min(90, realWeather.humidity + variation * 10))
    
    forecast.push({
      lap,
      condition: realWeather.condition,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      wind_speed: realWeather.wind_speed + (Math.random() - 0.5) * 2,
      rain_probability: realWeather.rain_probability,
      track_temperature: temperature + 10 + (Math.random() - 0.5) * 4,
      grip_level: realWeather.grip_level
    })
  }
  
  return forecast
}

function generateSimulatedWeatherForecast(trackId: string): WeatherForecast[] {
  const forecast: WeatherForecast[] = []
  const totalLaps = 50 // Default
  
  // Track-specific weather patterns
  const weatherPatterns: Record<string, any> = {
    monaco: { rain_probability: 0.3, temperature_variation: 5.0 },
    silverstone: { rain_probability: 0.4, temperature_variation: 8.0 },
    spa: { rain_probability: 0.5, temperature_variation: 10.0 },
    monza: { rain_probability: 0.2, temperature_variation: 6.0 },
    suzuka: { rain_probability: 0.4, temperature_variation: 7.0 }
  }
  
  const pattern = weatherPatterns[trackId] || { rain_probability: 0.3, temperature_variation: 5.0 }
  
  let currentCondition = "dry"
  let currentTemperature = 25.0
  let currentHumidity = 60.0
  
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Temperature variation
    const temperatureChange = (Math.random() - 0.5) * pattern.temperature_variation
    currentTemperature += temperatureChange
    const trackTemperature = currentTemperature + 10.0 + (Math.random() - 0.5) * 4
    
    // Humidity changes
    currentHumidity += (Math.random() - 0.5) * 10
    currentHumidity = Math.max(30, Math.min(90, currentHumidity))
    
    // Rain probability
    let rainProbability = pattern.rain_probability
    if (currentHumidity > 80 && currentTemperature < 20) {
      rainProbability = Math.min(0.8, rainProbability + 0.1)
    } else if (currentHumidity < 50 && currentTemperature > 25) {
      rainProbability = Math.max(0.05, rainProbability - 0.05)
    }
    
    // Simulate weather changes
    if (rainProbability > 0.6 && Math.random() < 0.1) {
      currentCondition = "wet"
    } else if (currentCondition === "wet" && rainProbability < 0.3) {
      currentCondition = "intermediate"
    } else if (currentCondition === "intermediate" && rainProbability < 0.2) {
      currentCondition = "dry"
    }
    
    forecast.push({
      lap,
      condition: currentCondition,
      temperature: Math.round(currentTemperature * 10) / 10,
      humidity: Math.round(currentHumidity * 10) / 10,
      wind_speed: Math.round((10 + (Math.random() - 0.5) * 10) * 10) / 10,
      rain_probability: Math.round(rainProbability * 100) / 100,
      track_temperature: Math.round(trackTemperature * 10) / 10,
      grip_level: currentCondition === "dry" ? 1.0 : currentCondition === "intermediate" ? 0.85 : 0.7
    })
  }
  
  return forecast
} 