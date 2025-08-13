import React, { useState, useEffect } from 'react'
import { Play, Plus, Trash2 } from 'lucide-react'
import { useSimulationStore } from '../store/simulationStore'
import toast from 'react-hot-toast'

const RaceStrategyForm = () => {
  const { 
    strategies, 
    activeStrategyId, 
    addStrategy, 
    editStrategy, 
    setActiveStrategy, 
    runSimulation, 
    isLoading,
    selectedTrack,
    availableTracks
  } = useSimulationStore()
  
  const [weather, setWeather] = useState('dry')
  const [selectedTrackDetails, setSelectedTrackDetails] = useState<any>(null)
  
  const strategy = strategies.find(s => s.id === activeStrategyId) || strategies[0]
  const [localStrategy, setLocalStrategy] = useState(strategy ? { ...strategy } : undefined)

  useEffect(() => {
    if (strategy) setLocalStrategy({ ...strategy })
  }, [strategy])

  useEffect(() => {
    if (selectedTrack && availableTracks.length > 0) {
      const track = availableTracks.find(t => t.id === selectedTrack)
      setSelectedTrackDetails(track)
    }
  }, [selectedTrack, availableTracks])

  useEffect(() => {
    if (strategies.length > 0 && !activeStrategyId) {
      setActiveStrategy(strategies[0].id)
    }
  }, [strategies, activeStrategyId, setActiveStrategy])

  const handlePitStopChange = (index: number, value: number) => {
    if (!localStrategy) return
    const newPitStops = [...localStrategy.pit_stops]
    newPitStops[index] = value
    setLocalStrategy({ ...localStrategy, pit_stops: newPitStops })
  }

  const addPitStop = () => {
    if (!localStrategy) return
    const newPitStops = [...localStrategy.pit_stops, 0]
    setLocalStrategy({ ...localStrategy, pit_stops: newPitStops })
  }

  const removePitStop = (index: number) => {
    if (!localStrategy) return
    const newPitStops = localStrategy.pit_stops.filter((_, i) => i !== index)
    setLocalStrategy({ ...localStrategy, pit_stops: newPitStops })
  }

  const handleTireChange = (index: number, value: string) => {
    if (!localStrategy) return
    const newTires = [...localStrategy.tires]
    newTires[index] = value
    setLocalStrategy({ ...localStrategy, tires: newTires })
  }

  const addTire = () => {
    if (!localStrategy) return
    const newTires = [...localStrategy.tires, 'Medium']
    setLocalStrategy({ ...localStrategy, tires: newTires })
  }

  const removeTire = (index: number) => {
    if (!localStrategy) return
    const newTires = localStrategy.tires.filter((_, i) => i !== index)
    setLocalStrategy({ ...localStrategy, tires: newTires })
  }

  const handleSave = () => {
    if (!strategy || !localStrategy) return
    if (strategy.id) {
      editStrategy(strategy.id, { ...localStrategy, id: strategy.id })
      toast.success('Strategy saved!')
    } else {
      addStrategy(localStrategy)
      toast.success('Strategy added!')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!strategy || !localStrategy) return
    if (strategy.id) {
      editStrategy(strategy.id, { ...localStrategy, id: strategy.id })
    } else {
      addStrategy(localStrategy)
    }
    
    try {
      await runSimulation(weather)
      toast('Simulation started...', { icon: '🏁' })
    } catch (err: any) {
      let msg = err.message || ''
      if (msg.includes('Rate limit exceeded') && msg.includes('per 1 day')) {
        msg = 'Rate limit exceeded: You have reached the maximum number of simulations allowed today.'
      }
      toast.error(msg || 'An error occurred while running the simulation.')
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

  if (!strategy || !localStrategy) {
    return (
      <div className="card flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 mb-4">Add strategies to compare.</p>
        <button
          onClick={handleNewStrategy}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Strategy</span>
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Race Strategy Configuration</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Strategy Name
        </label>
        <input
          type="text"
          value={localStrategy.name}
          onChange={(e) => setLocalStrategy({ ...localStrategy, name: e.target.value })}
          className="input-field"
          placeholder="Enter strategy name"
        />
      </div>
      
      {selectedTrackDetails && (
        <div className="mb-4 text-sm text-blue-900 dark:text-blue-300 font-semibold">
          Selected Track: <span className="dark:text-gray-100">{selectedTrackDetails.name}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Weather Conditions
          </label>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="input-field"
          >
            <option value="dry">Dry</option>
            <option value="wet">Wet</option>
            <option value="intermediate">Intermediate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Driver Style
          </label>
          <select
            value={localStrategy.driver_style}
            onChange={(e) => setLocalStrategy({ ...localStrategy, driver_style: e.target.value as any })}
            className="input-field"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pit Stop Laps
            </label>
            <button
              type="button"
              onClick={addPitStop}
              className="flex items-center space-x-1 text-f1-blue hover:text-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pit Stop</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {localStrategy.pit_stops.map((lap, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max={selectedTrackDetails?.total_laps || 58}
                  value={lap || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      // Allow empty input temporarily - don't update state
                      return;
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue > 0) {
                        handlePitStopChange(index, numValue);
                      }
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="Lap number"
                />
                <button
                  type="button"
                  onClick={() => removePitStop(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tire Compounds
            </label>
            <button
              type="button"
              onClick={addTire}
              className="flex items-center space-x-1 text-f1-blue hover:text-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tire</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {localStrategy.tires.map((tire, index) => (
              <div key={index} className="flex items-center space-x-2">
                <select
                  value={tire}
                  onChange={(e) => handleTireChange(index, e.target.value)}
                  className="input-field flex-1"
                >
                  <option value="Soft">Soft</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Wet">Wet</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeTire(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn-secondary w-full flex items-center justify-center space-x-2 mb-2"
        >
          <span>Save Strategy</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-5 h-5" />
          <span>{isLoading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </form>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        * Please minimize API requests as there is a rate limit for demo purposes.
      </p>
    </div>
  )
}

export default RaceStrategyForm 