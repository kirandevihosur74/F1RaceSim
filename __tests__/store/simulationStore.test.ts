import { renderHook, act } from '@testing-library/react'
import { useSimulationStore } from '@/store/simulationStore'
import axios from 'axios'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('SimulationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store to initial state
    const { result } = renderHook(() => useSimulationStore())
    act(() => {
      result.current.resetSimulation()
    })
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      expect(result.current.strategyInput).toEqual({
        pit_stops: [15, 35],
        tires: ['Medium', 'Hard', 'Soft'],
        driver_style: 'balanced'
      })
      expect(result.current.simulationResults).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.recommendations).toBeNull()
    })
  })

  describe('setStrategyInput', () => {
    it('should update strategy input partially', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      act(() => {
        result.current.setStrategyInput({ driver_style: 'aggressive' })
      })
      
      expect(result.current.strategyInput.driver_style).toBe('aggressive')
      expect(result.current.strategyInput.pit_stops).toEqual([15, 35]) // Should remain unchanged
    })

    it('should update pit stops', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      act(() => {
        result.current.setStrategyInput({ pit_stops: [10, 25, 40] })
      })
      
      expect(result.current.strategyInput.pit_stops).toEqual([10, 25, 40])
    })

    it('should update tires', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      act(() => {
        result.current.setStrategyInput({ tires: ['Soft', 'Medium'] })
      })
      
      expect(result.current.strategyInput.tires).toEqual(['Soft', 'Medium'])
    })
  })

  describe('runSimulation', () => {
    it('should call API and update state on success', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          simulation: [
            { lap: 1, lap_time: 85.4, tire_wear: 2.0 },
            { lap: 2, lap_time: 85.6, tire_wear: 4.1 }
          ],
          total_time: 171.0
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const { result } = renderHook(() => useSimulationStore())
      
      await act(async () => {
        await result.current.runSimulation('dry')
      })
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/simulate-race', {
        strategy: result.current.strategyInput,
        weather: 'dry'
      })
      expect(result.current.simulationResults).toEqual(mockResponse.data)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle API errors', async () => {
      const mockError = new Error('API Error')
      mockedAxios.post.mockRejectedValueOnce(mockError)
      
      const { result } = renderHook(() => useSimulationStore())
      
      await act(async () => {
        await result.current.runSimulation('wet')
      })
      
      expect(result.current.error).toBe('API Error')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.simulationResults).toBeNull()
    })

    it('should set loading state during API call', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockedAxios.post.mockReturnValueOnce(promise)
      
      const { result } = renderHook(() => useSimulationStore())
      
      // Start the simulation
      const simulationPromise = act(async () => {
        await result.current.runSimulation('dry')
      })
      
      // Check loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeNull()
      
      // Resolve the promise
      resolvePromise!({
        data: {
          status: 'success',
          simulation: [{ lap: 1, lap_time: 85.4, tire_wear: 2.0 }]
        }
      })
      
      await simulationPromise
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('getStrategyRecommendation', () => {
    it('should call API and update recommendations on success', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          recommendation: 'Consider using Medium tires for better tire life.'
        }
      }
      
      mockedAxios.post.mockResolvedValueOnce(mockResponse)
      
      const { result } = renderHook(() => useSimulationStore())
      
      await act(async () => {
        await result.current.getStrategyRecommendation('Test scenario')
      })
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/strategy-recommendation', {
        scenario: 'Test scenario'
      })
      expect(result.current.recommendations).toBe('Consider using Medium tires for better tire life.')
    })

    it('should handle recommendation API errors', async () => {
      const mockError = new Error('Recommendation API Error')
      mockedAxios.post.mockRejectedValueOnce(mockError)
      
      const { result } = renderHook(() => useSimulationStore())
      
      await act(async () => {
        await result.current.getStrategyRecommendation('Test scenario')
      })
      
      expect(result.current.error).toBe('Recommendation API Error')
    })
  })

  describe('resetSimulation', () => {
    it('should reset simulation state to initial values', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      // Set some state first
      act(() => {
        result.current.setStrategyInput({ driver_style: 'aggressive' })
      })
      
      // Mock some simulation results
      act(() => {
        result.current.simulationResults = {
          status: 'success',
          simulation: [{ lap: 1, lap_time: 85.4, tire_wear: 2.0 }]
        }
      })
      
      // Reset
      act(() => {
        result.current.resetSimulation()
      })
      
      expect(result.current.simulationResults).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.recommendations).toBeNull()
      // Strategy input should remain unchanged
      expect(result.current.strategyInput.driver_style).toBe('aggressive')
    })
  })

  describe('Store Integration', () => {
    it('should maintain state between component renders', () => {
      const { result: result1 } = renderHook(() => useSimulationStore())
      const { result: result2 } = renderHook(() => useSimulationStore())
      
      act(() => {
        result1.current.setStrategyInput({ driver_style: 'conservative' })
      })
      
      expect(result2.current.strategyInput.driver_style).toBe('conservative')
    })

    it('should handle multiple state updates correctly', () => {
      const { result } = renderHook(() => useSimulationStore())
      
      act(() => {
        result.current.setStrategyInput({ 
          pit_stops: [10, 20],
          tires: ['Soft', 'Medium'],
          driver_style: 'aggressive'
        })
      })
      
      expect(result.current.strategyInput).toEqual({
        pit_stops: [10, 20],
        tires: ['Soft', 'Medium'],
        driver_style: 'aggressive'
      })
    })
  })
}) 