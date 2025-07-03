import React, { useState } from 'react'
import { Play, Plus, Trash2 } from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'

const RaceStrategyForm: React.FC = () => {
  const { strategyInput, setStrategyInput, runSimulation, isLoading } = useSimulationStore()
  const [weather, setWeather] = useState('dry')

  const handlePitStopChange = (index: number, value: number) => {
    const newPitStops = [...strategyInput.pit_stops]
    newPitStops[index] = value
    setStrategyInput({ pit_stops: newPitStops })
  }

  const addPitStop = () => {
    const newPitStops = [...strategyInput.pit_stops, 0]
    setStrategyInput({ pit_stops: newPitStops })
  }

  const removePitStop = (index: number) => {
    const newPitStops = strategyInput.pit_stops.filter((_, i) => i !== index)
    setStrategyInput({ pit_stops: newPitStops })
  }

  const handleTireChange = (index: number, value: string) => {
    const newTires = [...strategyInput.tires]
    newTires[index] = value
    setStrategyInput({ tires: newTires })
  }

  const addTire = () => {
    const newTires = [...strategyInput.tires, 'Medium']
    setStrategyInput({ tires: newTires })
  }

  const removeTire = (index: number) => {
    const newTires = strategyInput.tires.filter((_, i) => i !== index)
    setStrategyInput({ tires: newTires })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSimulation(weather)
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Race Strategy Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Weather Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Driver Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver Style
          </label>
          <select
            value={strategyInput.driver_style}
            onChange={(e) => setStrategyInput({ driver_style: e.target.value as any })}
            className="input-field"
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        {/* Pit Stops */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
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
            {strategyInput.pit_stops.map((lap, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="58"
                  value={lap}
                  onChange={(e) => handlePitStopChange(index, parseInt(e.target.value) || 0)}
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

        {/* Tire Strategy */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
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
            {strategyInput.tires.map((tire, index) => (
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-5 h-5" />
          <span>{isLoading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </form>
    </div>
  )
}

export default RaceStrategyForm 