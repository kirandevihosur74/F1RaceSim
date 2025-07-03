import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In development, we'll simulate the response
    // In production, this would call the FastAPI backend
    const { strategy, weather } = body
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate mock simulation data
    const simulation = generateMockSimulation(strategy, weather)
    
    return NextResponse.json({
      status: 'success',
      simulation,
      total_time: simulation.reduce((sum, lap) => sum + lap.lap_time, 0),
      strategy_analysis: `Simulated ${simulation.length} laps with ${strategy.pit_stops.length} pit stops using ${strategy.tires.join(' → ')} compounds.`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate race' },
      { status: 500 }
    )
  }
}

function generateMockSimulation(strategy: any, weather: string) {
  const totalLaps = 58
  const simulation = []
  let tireWear = 0
  let currentTireIndex = 0
  let baseLapTime = 85.0 // Base lap time in seconds
  
  // Weather adjustments
  const weatherMultiplier = weather === 'wet' ? 1.15 : weather === 'intermediate' ? 1.08 : 1.0
  
  // Driver style adjustments
  const driverMultiplier = strategy.driver_style === 'aggressive' ? 0.98 : 
                          strategy.driver_style === 'conservative' ? 1.02 : 1.0
  
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Check if this is a pit stop lap
    if (strategy.pit_stops.includes(lap)) {
      tireWear = 0
      currentTireIndex = Math.min(currentTireIndex + 1, strategy.tires.length - 1)
    }
    
    // Calculate lap time with various factors
    const fuelLoadImpact = (lap - 1) * 0.02 // Fuel load increases lap time
    const tireWearImpact = tireWear * 0.1 // Tire wear increases lap time
    const weatherImpact = weatherMultiplier
    const driverImpact = driverMultiplier
    
    const lapTime = (baseLapTime + fuelLoadImpact + tireWearImpact) * weatherImpact * driverImpact
    
    // Add some randomness
    const randomVariation = (Math.random() - 0.5) * 0.5
    const finalLapTime = lapTime + randomVariation
    
    simulation.push({
      lap,
      lap_time: Math.round(finalLapTime * 10) / 10,
      tire_wear: Math.round(tireWear * 10) / 10
    })
    
    // Increase tire wear
    tireWear += 1.5 + Math.random() * 0.5
  }
  
  return simulation
} 