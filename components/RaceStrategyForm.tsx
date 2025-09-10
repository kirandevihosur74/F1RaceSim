import React, { useState, useEffect } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { showSuccessToast, showErrorToast, showInfoToast } from '../lib/toast'
import { Plus, Trash2, Save, Play, AlertCircle, Edit } from 'lucide-react'
import Dropdown, { DropdownOption } from './ui/Dropdown'
import { isFeatureIncluded } from '../lib/pricing'
import { useUsage } from '../lib/hooks/useUsage'
import Link from 'next/link'

type WeatherType = 'dry' | 'wet' | 'intermediate'
type DriverStyleType = 'conservative' | 'balanced' | 'aggressive'

interface ValidationErrors {
  strategyName?: string
  weatherConditions?: string
  driverStyle?: string
  pitStops?: string
  tires?: string
}

interface RaceStrategyFormProps {
  onSimulationComplete?: () => void
}

const RaceStrategyForm: React.FC<RaceStrategyFormProps> = ({ onSimulationComplete }) => {
  const { 
    selectedTrack, 
    availableTracks, 
    addStrategy, 
    editStrategy, 
    strategies, 
    runSimulation, 
    isLoading,
    activeStrategyId,
    setActiveStrategy
  } = useSimulationStore()
  
  const [localStrategy, setLocalStrategy] = useState({
    id: '',
    name: '',
    weather_conditions: 'dry' as WeatherType,
    driver_style: 'balanced' as DriverStyleType,
    pit_stops: [0] as number[], // Start with one empty pit stop input
    tires: ['Medium'] as string[] // Start with one tire compound (Medium)
  })

  const [strategyName, setStrategyName] = useState('')
  const [existingStrategy, setExistingStrategy] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isEditing, setIsEditing] = useState(false)
  
  // TODO: Get user's current plan from subscription
  const currentPlan = 'free' // This should come from user's subscription
  
  // Usage tracking
  const { usage, checkUsage, incrementUsage } = useUsage()
  
  // Get simulation usage
  const simulationUsage = usage.find(u => u.feature === 'simulations')
  const canRunSimulation = simulationUsage ? simulationUsage.current < simulationUsage.limit : true

  // Get selected track details
  const selectedTrackDetails = availableTracks.find(track => track.id === selectedTrack)

  // Weather options
  const weatherOptions: DropdownOption[] = [
    { value: 'dry', label: 'Dry' },
    { value: 'wet', label: 'Wet' },
    { value: 'intermediate', label: 'Intermediate' }
  ]

  // Driver style options
  const driverStyleOptions: DropdownOption[] = [
    { value: 'conservative', label: 'Conservative' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'aggressive', label: 'Aggressive' }
  ]

  // Tire compound options
  const tireOptions: DropdownOption[] = [
    { value: 'Soft', label: 'Soft' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Wet', label: 'Wet' }
  ]

  // Strategy options for editing
  const strategyOptions: DropdownOption[] = [
    { value: '', label: 'Create New Strategy' },
    ...strategies.map(strategy => ({
      value: strategy.id,
      label: strategy.name
    }))
  ]

  useEffect(() => {
    if (selectedTrackDetails) {
      setLocalStrategy(prev => ({
        ...prev,
        weather_conditions: 'dry',
        driver_style: 'balanced',
        pit_stops: [0], // Start with one empty pit stop input
        tires: ['Medium'] // Start with one tire compound (Medium)
      }))
    }
  }, [selectedTrackDetails])

  // Load active strategy when activeStrategyId changes
  useEffect(() => {
    if (activeStrategyId) {
      const strategy = strategies.find(s => s.id === activeStrategyId)
      if (strategy) {
        setExistingStrategy(strategy)
        setLocalStrategy({
          id: strategy.id,
          name: strategy.name,
          weather_conditions: strategy.weather_conditions || 'dry',
          driver_style: strategy.driver_style || 'balanced',
          pit_stops: strategy.pit_stops && strategy.pit_stops.length > 0 ? [...strategy.pit_stops] : [0],
          tires: strategy.tires && strategy.tires.length > 0 ? [...strategy.tires] : ['Medium']
        })
        setStrategyName(strategy.name)
        setIsEditing(true)
      }
    } else {
      // Reset form for new strategy
      setExistingStrategy(null)
      setLocalStrategy({
        id: '',
        name: '',
        weather_conditions: 'dry',
        driver_style: 'balanced',
        pit_stops: [0], // Start with one empty pit stop input
        tires: ['Medium'] // Start with one tire compound (Medium)
      })
      setStrategyName('')
      setIsEditing(false)
    }
  }, [activeStrategyId, strategies])

  // Load existing strategy when selected for editing
  useEffect(() => {
    if (existingStrategy) {
      setLocalStrategy({
        id: existingStrategy.id,
        name: existingStrategy.name,
        weather_conditions: existingStrategy.weather_conditions || 'dry',
        driver_style: existingStrategy.driver_style || 'balanced',
        pit_stops: existingStrategy.pit_stops && existingStrategy.pit_stops.length > 0 ? [...existingStrategy.pit_stops] : [0],
        tires: existingStrategy.tires && existingStrategy.tires.length > 0 ? [...existingStrategy.tires] : ['Medium']
      })
      setStrategyName(existingStrategy.name)
      setIsEditing(true)
    } else {
      // Reset form for new strategy
      setLocalStrategy({
        id: '',
        name: '',
        weather_conditions: 'dry',
        driver_style: 'balanced',
        pit_stops: [0], // Start with one empty pit stop input
        tires: ['Medium'] // Start with one tire compound (Medium)
      })
      setStrategyName('')
      setIsEditing(false)
    }
  }, [existingStrategy])

  // Clear validation errors when inputs change
  useEffect(() => {
    if (validationErrors.strategyName && strategyName.trim()) {
      setValidationErrors(prev => ({ ...prev, strategyName: undefined }))
    }
  }, [strategyName, validationErrors.strategyName])

  useEffect(() => {
    if (validationErrors.pitStops && localStrategy.pit_stops.length > 0) {
      setValidationErrors(prev => ({ ...prev, pitStops: undefined }))
    }
  }, [localStrategy.pit_stops, validationErrors.pitStops])

  useEffect(() => {
    if (validationErrors.tires && localStrategy.tires.length > 0) {
      setValidationErrors(prev => ({ ...prev, tires: undefined }))
    }
  }, [localStrategy.tires, validationErrors.tires])

  const handleStrategySelect = (strategyId: string) => {
    if (strategyId === '') {
      // Create new strategy
      setActiveStrategy(null)
      setExistingStrategy(null)
    } else {
      // Edit existing strategy
      setActiveStrategy(strategyId)
    }
  }

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Strategy name validation
    if (!strategyName.trim()) {
      errors.strategyName = 'Strategy name is required'
    } else if (strategyName.trim().length < 3) {
      errors.strategyName = 'Strategy name must be at least 3 characters'
    }

    // Weather conditions validation
    if (!localStrategy.weather_conditions) {
      errors.weatherConditions = 'Weather conditions are required'
    }

    // Driver style validation
    if (!localStrategy.driver_style) {
      errors.driverStyle = 'Driver style is required'
    }

    // Pit stops validation
    if (localStrategy.pit_stops.length === 0 || (localStrategy.pit_stops.length === 1 && localStrategy.pit_stops[0] === 0)) {
      errors.pitStops = 'At least one pit stop is required'
    } else {
      // Check if any pit stop has invalid values
      const invalidPitStops = localStrategy.pit_stops.some(lap => !lap || lap <= 0 || lap > (selectedTrackDetails?.total_laps || 58))
      if (invalidPitStops) {
        errors.pitStops = 'Pit stop laps must be between 1 and total track laps'
      }
    }

    // Tires validation
    if (localStrategy.tires.length === 0 || (localStrategy.tires.length === 1 && !localStrategy.tires[0].trim())) {
      errors.tires = 'At least one tire compound is required'
    } else {
      // Check if any tire is empty
      const invalidTires = localStrategy.tires.some(tire => !tire.trim())
      if (invalidTires) {
        errors.tires = 'All tire compounds must be selected'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addPitStop = () => {
    // Check if user can add more pit stops based on plan
    if (currentPlan === 'free' && localStrategy.pit_stops.length >= 2) {
      showErrorToast('Free plan limited to 2 pit stops. Upgrade to Pro for unlimited pit stops.')
      return
    }
    
    setLocalStrategy(prev => ({
      ...prev,
      pit_stops: [...prev.pit_stops, 0]
    }))
    // Clear pit stop validation error when adding
    if (validationErrors.pitStops) {
      setValidationErrors(prev => ({ ...prev, pitStops: undefined }))
    }
  }

  const removePitStop = (index: number) => {
    setLocalStrategy(prev => ({
      ...prev,
      pit_stops: prev.pit_stops.filter((_, i) => i !== index)
    }))
  }

  const handlePitStopChange = (index: number, value: number) => {
    setLocalStrategy(prev => ({
      ...prev,
      pit_stops: prev.pit_stops.map((lap, i) => i === index ? value : lap)
    }))
  }

  const addTire = () => {
    // Check if user can add more tires based on plan
    if (currentPlan === 'free' && localStrategy.tires.length >= 3) {
      showErrorToast('Free plan limited to 3 tire compounds. Upgrade to Pro for unlimited tires.')
      return
    }
    
    setLocalStrategy(prev => ({
      ...prev,
      tires: [...prev.tires, 'Medium']
    }))
    // Clear tire validation error when adding
    if (validationErrors.tires) {
      setValidationErrors(prev => ({ ...prev, tires: undefined }))
    }
  }

  const removeTire = (index: number) => {
    setLocalStrategy(prev => ({
      ...prev,
      tires: prev.tires.filter((_, i) => i !== index)
    }))
  }

  const handleTireChange = (index: number, value: string) => {
    setLocalStrategy(prev => ({
      ...prev,
      tires: prev.tires.map((tire, i) => i === index ? value : tire)
    }))
  }

  const handleSave = () => {
    if (!validateForm()) {
      showErrorToast('Please fix all validation errors before saving')
      return
    }

    // Check strategy limit for free plan
    if (currentPlan === 'free' && strategies.length >= 5) {
      showErrorToast('Free plan limited to 5 strategies. Upgrade to Pro for unlimited strategies.')
      return
    }

    const newStrategy = {
      id: existingStrategy ? existingStrategy.id : Date.now().toString(),
      name: strategyName.trim(),
      weather_conditions: localStrategy.weather_conditions,
      driver_style: localStrategy.driver_style,
      pit_stops: [...localStrategy.pit_stops].sort((a, b) => a - b),
      tires: [...localStrategy.tires]
    }

    if (existingStrategy) {
      // Update existing strategy
      editStrategy(existingStrategy.id, newStrategy)
      showSuccessToast('Strategy updated successfully!')
    } else {
      // Add new strategy
      addStrategy(newStrategy)
      showSuccessToast('Strategy added successfully!')
    }

    // Reset form
    setStrategyName('')
    setLocalStrategy({
      id: '',
      name: '',
      weather_conditions: 'dry',
      driver_style: 'balanced',
      pit_stops: [0], // Start with one empty pit stop input
      tires: ['Medium'] // Start with one tire compound (Medium)
    })
    setExistingStrategy(null)
    setActiveStrategy(null)
    setIsEditing(false)
    setValidationErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showErrorToast('Please fix all validation errors before running simulation')
      return
    }

    // Check simulation limit for free plan
    if (currentPlan === 'free') {
      try {
        const usageCheck = await checkUsage('simulations')
        if (!usageCheck.allowed) {
          showErrorToast(usageCheck.message || 'Daily simulation limit reached. Upgrade to Pro for unlimited simulations.')
          return
        }
      } catch (error) {
        showErrorToast('Failed to check usage limits')
        return
      }
    }

    setIsRunning(true)
          showInfoToast('Simulation started...')

    try {
      // Create a strategy object and add it to the store first
      const newStrategy = {
        id: existingStrategy ? existingStrategy.id : Date.now().toString(),
        name: strategyName || `Strategy ${Date.now()}`,
        weather_conditions: localStrategy.weather_conditions,
        pit_stops: [...localStrategy.pit_stops].filter(lap => lap > 0).sort((a, b) => a - b),
        tires: [...localStrategy.tires].filter(tire => tire.trim()),
        driver_style: localStrategy.driver_style
      }

      if (existingStrategy) {
        editStrategy(existingStrategy.id, newStrategy)
      } else {
        addStrategy(newStrategy)
      }

      // Run simulation with weather string
      await runSimulation(localStrategy.weather_conditions)
      
      // Track usage for simulations
      if (currentPlan === 'free') {
        await incrementUsage('simulations')
      }
      
      // Trigger simulation completion callback
      if (onSimulationComplete) {
        onSimulationComplete()
      }
    } catch (err: any) {
      let msg = err.message || ''
      if (msg.includes('Rate limit exceeded') && msg.includes('per 1 day')) {
        msg = 'Rate limit exceeded: You have reached the maximum number of simulations allowed today.'
      }
      showErrorToast(msg || 'An error occurred while running the simulation.')
    } finally {
      setIsRunning(false)
    }
  }

  if (!selectedTrack) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl text-gray-400">Race</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Select a Track First
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a track from the left to configure your race strategy
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Race Strategy Configuration
        </h3>
        {currentPlan === 'free' && (
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">🔒</span>
              <span className="text-gray-600 dark:text-gray-300">Free Plan</span>
            </div>
            <Link 
              href="/pricing" 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Upgrade to Pro
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </div>
      
      {selectedTrackDetails && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          Selected Track: <span className="dark:text-gray-100">{selectedTrackDetails.name}</span>
        </div>
      )}

      {/* Usage Display and Upgrade Prompt */}
      {simulationUsage && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Simulations: {simulationUsage.current}/{simulationUsage.limit}
                </span>
                {simulationUsage.limit !== -1 && (
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    (resets daily)
                  </span>
                )}
              </div>
            </div>
            {!canRunSimulation && (
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  Daily limit reached
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Strategy Selector */}
      <div className="mb-6">
        <Dropdown
          label="Select Strategy to Edit"
          options={strategyOptions}
          value={activeStrategyId || ''}
          onChange={handleStrategySelect}
          placeholder="Choose a strategy to edit or create new"
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Strategy Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            placeholder="Enter strategy name"
            className={`input-field ${validationErrors.strategyName ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''}`}
            required
          />
          {validationErrors.strategyName && (
            <div className="flex items-center mt-1 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.strategyName}
            </div>
          )}
        </div>

        <Dropdown
          label="Weather Conditions *"
          options={weatherOptions}
          value={localStrategy.weather_conditions}
          onChange={(value) => setLocalStrategy({ ...localStrategy, weather_conditions: value as WeatherType })}
          placeholder="Select weather conditions"
          error={validationErrors.weatherConditions}
        />

        <Dropdown
          label="Driver Style *"
          options={driverStyleOptions}
          value={localStrategy.driver_style}
          onChange={(value) => setLocalStrategy({ ...localStrategy, driver_style: value as DriverStyleType })}
          placeholder="Select driver style"
          error={validationErrors.driverStyle}
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pit Stop Laps <span className="text-red-500">*</span>
              {currentPlan === 'free' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Free: max 2, Pro+: unlimited)
                </span>
              )}
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
                  className={`input-field flex-1 ${validationErrors.pitStops ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''}`}
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
          {validationErrors.pitStops && (
            <div className="flex items-center mt-1 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.pitStops}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tire Compounds <span className="text-red-500">*</span>
              {currentPlan === 'free' && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  (Free: max 3, Pro+: unlimited)
                </span>
              )}
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
                <Dropdown
                  options={tireOptions}
                  value={tire}
                  onChange={(value) => handleTireChange(index, value)}
                  placeholder="Select tire compound"
                  className={`flex-1 ${validationErrors.tires ? 'border-red-300 dark:border-red-600' : ''}`}
                />
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
          {validationErrors.tires && (
            <div className="flex items-center mt-1 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationErrors.tires}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn-secondary w-full flex items-center justify-center space-x-2 mb-2"
        >
          {isEditing ? <Edit className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Update Strategy' : 'Save Strategy'}</span>
        </button>

        <button
          type="submit"
          disabled={isLoading || !canRunSimulation}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Play className="w-5 h-5" />
          <span>
            {isLoading ? 'Simulating...' : 
             !canRunSimulation ? 'Daily Limit Reached' : 
             'Run Simulation'}
          </span>
        </button>
        
        {currentPlan === 'free' && (
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <span className="text-sm font-medium">Free Plan Limitations</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Upgrade to Pro for unlimited simulations, advanced analytics, and more features
            </p>
            <Link href="/pricing" className="inline-block mt-2 text-xs text-yellow-800 dark:text-yellow-200 underline hover:no-underline">
              View Pricing Plans
            </Link>
          </div>
        )}
      </form>
      

    </div>
  )
}

export default RaceStrategyForm 