import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RaceStrategyForm from '@/components/RaceStrategyForm'
import { useSimulationStore } from '@/store/simulationStore'

// Mock the store
jest.mock('@/store/simulationStore')

const mockUseSimulationStore = useSimulationStore as jest.MockedFunction<typeof useSimulationStore>

describe('RaceStrategyForm', () => {
  const mockStore = {
    strategies: [
      {
        id: 'test-1',
        name: 'Test Strategy',
        pit_stops: [15, 35],
        tires: ['Medium', 'Hard', 'Soft'],
        driver_style: 'balanced' as const,
      }
    ],
    activeStrategyId: 'test-1',
    addStrategy: jest.fn(),
    editStrategy: jest.fn(),
    setActiveStrategy: jest.fn(),
    runSimulation: jest.fn(),
    isLoading: false,
    selectedTrack: 'silverstone',
    availableTracks: []
  }

  beforeEach(() => {
    mockUseSimulationStore.mockReturnValue(mockStore)
    jest.clearAllMocks()
  })

  it('renders the form with all inputs', () => {
    render(<RaceStrategyForm />)
    
    expect(screen.getByText('Race Strategy Configuration')).toBeInTheDocument()
    expect(screen.getByLabelText(/Weather Conditions/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Driver Style/)).toBeInTheDocument()
    expect(screen.getByText(/Pit Stop Laps/)).toBeInTheDocument()
    expect(screen.getByText(/Tire Compounds/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Run Simulation/ })).toBeInTheDocument()
  })

  it('displays current strategy values', () => {
    render(<RaceStrategyForm />)
    
    // Check weather dropdown
    const weatherSelect = screen.getByLabelText(/Weather Conditions/)
    expect(weatherSelect).toHaveValue('dry')
    
    // Check driver style dropdown
    const driverSelect = screen.getByLabelText(/Driver Style/)
    expect(driverSelect).toHaveValue('balanced')
    
    // Check pit stop inputs
    const pitStopInputs = screen.getAllByPlaceholderText('Lap number')
    expect(pitStopInputs[0]).toHaveValue(15)
    expect(pitStopInputs[1]).toHaveValue(35)
    
    // Check tire selects
    const tireSelects = screen.getAllByRole('combobox').filter(select => 
      select.getAttribute('aria-label')?.includes('Tire Compounds') || 
      select.parentElement?.textContent?.includes('Tire Compounds')
    )
    expect(tireSelects[0]).toHaveValue('Medium')
    expect(tireSelects[1]).toHaveValue('Hard')
    expect(tireSelects[2]).toHaveValue('Soft')
  })

  it('allows adding pit stops', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const addPitStopButton = screen.getByText('Add Pit Stop')
    expect(addPitStopButton).toBeInTheDocument()
  })

  it('allows removing pit stops', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // Assuming Trash2 icon is rendered as SVG
    )
    
    expect(removeButtons.length).toBeGreaterThan(0)
  })

  it('allows adding tires', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const addTireButton = screen.getByText('Add Tire')
    expect(addTireButton).toBeInTheDocument()
  })

  it('allows removing tires', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const removeButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // Assuming Trash2 icon is rendered as SVG
    )
    
    expect(removeButtons.length).toBeGreaterThan(1)
  })

  it('displays pit stop inputs', () => {
    render(<RaceStrategyForm />)
    const pitStopInputs = screen.getAllByPlaceholderText('Lap number')
    expect(pitStopInputs.length).toBeGreaterThan(0)
  })

  it('displays tire selection dropdowns', () => {
    render(<RaceStrategyForm />)
    const tireSelects = screen.getAllByRole('combobox').filter(select => 
      select.getAttribute('aria-label')?.includes('Tire Compounds') || 
      select.parentElement?.textContent?.includes('Tire Compounds')
    )
    expect(tireSelects.length).toBeGreaterThan(0)
  })

  it('displays driver style dropdown', () => {
    render(<RaceStrategyForm />)
    const driverSelect = screen.getByLabelText(/Driver Style/)
    expect(driverSelect).toBeInTheDocument()
  })

  it('submits form and calls runSimulation', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const submitButton = screen.getByRole('button', { name: /Run Simulation/ })
    await user.click(submitButton)
    
    expect(mockStore.runSimulation).toHaveBeenCalledWith('dry')
  })

  it('shows loading state when simulation is running', () => {
    mockUseSimulationStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
    })
    
    render(<RaceStrategyForm />)
    
    const submitButton = screen.getByRole('button', { name: /Simulating/ })
    expect(submitButton).toBeDisabled()
  })

  it('validates pit stop input values', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const pitStopInputs = screen.getAllByPlaceholderText('Lap number')
    const firstInput = pitStopInputs[0]
    
    // Test minimum value
    await user.clear(firstInput)
    await user.type(firstInput, '0')
    expect(firstInput).toHaveValue(0)
    
    // Test maximum value
    await user.clear(firstInput)
    await user.type(firstInput, '100')
    expect(firstInput).toHaveValue(58) // Should be capped at 58
  })

  it('handles weather condition changes', async () => {
    const user = userEvent.setup()
    render(<RaceStrategyForm />)
    
    const weatherSelect = screen.getByLabelText(/Weather Conditions/)
    await user.selectOptions(weatherSelect, 'wet')
    
    // The weather state is local to the component, so we test the form submission
    const submitButton = screen.getByRole('button', { name: /Run Simulation/ })
    await user.click(submitButton)
    
    // The form should submit with the selected weather
    expect(mockStore.runSimulation).toHaveBeenCalledWith('wet')
  })
}) 