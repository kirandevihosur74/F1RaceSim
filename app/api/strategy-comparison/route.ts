import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      strategies, 
      weather = "dry", 
      track_id = "silverstone",
      num_simulations = 5
    } = body

    if (!strategies || !Array.isArray(strategies) || strategies.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 strategies are required for comparison' },
        { status: 400 }
      )
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate comparison results
    const comparison = generateStrategyComparison(strategies, weather, track_id, num_simulations)

    return NextResponse.json({
      success: true,
      comparison
    })

  } catch (error) {
    console.error('Strategy comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to compare strategies' },
      { status: 500 }
    )
  }
}

function generateStrategyComparison(strategies: any[], weather: string, track_id: string, num_simulations: number) {
  const trackData = getTrackDetails(track_id)
  const comparisonResults = []
  
  for (const strategy of strategies) {
    const strategyResults = []
    
    // Run multiple simulations for this strategy
    for (let sim = 0; sim < num_simulations; sim++) {
      const result = simulateStrategy(strategy, weather, track_id)
      strategyResults.push(result)
    }
    
    // Calculate average metrics
    const avgTotalTime = strategyResults.reduce((sum, r) => sum + r.totalTime, 0) / num_simulations
    const allLapTimes = strategyResults.flatMap(r => r.lapTimes)
    const avgLap = allLapTimes.reduce((sum, lt) => sum + lt, 0) / allLapTimes.length
    const bestLap = Math.min(...allLapTimes)
    
    // Analyze tire wear
    const tireWearAnalysis = analyzeTireWear(strategy, weather, trackData)
    
    // Analyze weather impact
    const weatherImpact = analyzeWeatherImpact(strategy, weather, trackData)
    
    // Calculate risk score
    const riskScore = calculateRiskScore(strategy, strategyResults)
    
    comparisonResults.push({
      name: strategy.name || "Strategy",
      total_time: avgTotalTime,
      pit_stops: strategy.pit_stops,
      tires: strategy.tires,
      driver_style: strategy.driver_style,
      best_lap: bestLap,
      average_lap: avgLap,
      risk_score: riskScore,
      tire_wear_analysis: tireWearAnalysis,
      weather_impact: weatherImpact
    })
  }
  
  // Find winner
  const winner = comparisonResults.reduce((best, current) => 
    current.total_time < best.total_time ? current : best
  )
  
  // Analyze key differences
  const keyDifferences = analyzeKeyDifferences(comparisonResults)
  
  // Generate optimization suggestions
  const optimizationSuggestions = generateOptimizationSuggestions(comparisonResults)
  
  // Risk analysis
  const riskAnalysis = analyzeRisks(comparisonResults)
  
  return {
    strategies: comparisonResults,
    winner: {
      name: winner.name,
      total_time: winner.total_time
    },
    key_differences: keyDifferences,
    optimization_suggestions: optimizationSuggestions,
    risk_analysis: riskAnalysis
  }
}

function simulateStrategy(strategy: any, weather: string, track_id: string) {
  const trackData = getTrackDetails(track_id)
  const totalLaps = trackData.total_laps
  const lapTimes = []
  let totalTime = 0
  let tireWear = 0
  let currentTireIndex = 0
  let baseLapTime = trackData.lap_record
  
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
      totalTime += 25 // Pit stop time
    }
    
    // Calculate lap time
    const fuelLoadImpact = lap * 0.02
    const tireWearImpact = tireWear * 0.1
    const lapTime = (baseLapTime + fuelLoadImpact + tireWearImpact) * weatherMultiplier * driverMultiplier
    const finalLapTime = lapTime + (Math.random() - 0.5) * 0.5
    
    lapTimes.push(finalLapTime)
    totalTime += finalLapTime
    
    // Increase tire wear
    tireWear += 1.5 + Math.random() * 0.5
  }
  
  return {
    totalTime,
    lapTimes
  }
}

function analyzeTireWear(strategy: any, weather: string, trackData: any) {
  const pitStops = strategy.pit_stops
  const tires = strategy.tires
  
  // Calculate stint lengths
  const stintLengths = []
  for (let i = 0; i <= pitStops.length; i++) {
    if (i === 0) {
      stintLengths.push(pitStops[0] || trackData.total_laps)
    } else if (i === pitStops.length) {
      stintLengths.push(trackData.total_laps - pitStops[pitStops.length - 1])
    } else {
      stintLengths.push(pitStops[i] - pitStops[i - 1])
    }
  }
  
  // Analyze tire degradation
  const tireAnalysis: any = {}
  for (let i = 0; i < tires.length; i++) {
    if (i < stintLengths.length) {
      const degradation = trackData.tire_degradation[tires[i]] || 1.0
      const wearRisk = degradation > 1.2 ? "high" : degradation > 1.0 ? "medium" : "low"
      
      tireAnalysis[tires[i]] = {
        stint_length: stintLengths[i],
        degradation_factor: degradation,
        wear_risk: wearRisk,
        optimal_stint_length: calculateOptimalStintLength(tires[i], weather)
      }
    }
  }
  
  return {
    stint_lengths: stintLengths,
    tire_analysis: tireAnalysis,
    overall_wear_risk: calculateOverallWearRisk(tireAnalysis)
  }
}

function calculateOptimalStintLength(tire: string, weather: string) {
  const baseLengths: any = {
    "Soft": 15,
    "Medium": 25,
    "Hard": 35,
    "Intermediate": 20,
    "Wet": 18
  }
  
  const weatherMultipliers: any = {
    "dry": 1.0,
    "intermediate": 0.9,
    "wet": 0.8
  }
  
  const baseLength = baseLengths[tire] || 20
  const weatherMult = weatherMultipliers[weather] || 1.0
  
  return Math.floor(baseLength * weatherMult)
}

function calculateOverallWearRisk(tireAnalysis: any) {
  const highRiskCount = Object.values(tireAnalysis).filter((analysis: any) => analysis.wear_risk === "high").length
  const mediumRiskCount = Object.values(tireAnalysis).filter((analysis: any) => analysis.wear_risk === "medium").length
  
  if (highRiskCount > 0) return "high"
  if (mediumRiskCount > 1) return "medium"
  return "low"
}

function analyzeWeatherImpact(strategy: any, weather: string, trackData: any) {
  const pitStops = strategy.pit_stops
  const tires = strategy.tires
  
  // Count weather events during pit windows (simplified)
  const weatherEventsDuringPits = Math.random() < 0.3 ? 1 : 0
  
  // Analyze tire compound suitability
  const weatherSuitability: any = {}
  for (const tire of tires) {
    const performanceMultiplier = weather === "dry" ? 1.0 : weather === "intermediate" ? 0.8 : 0.6
    weatherSuitability[tire] = {
      performance_multiplier: performanceMultiplier,
      suitability: performanceMultiplier > 0.8 ? "optimal" : "suboptimal"
    }
  }
  
  return {
    weather_events_during_pits: weatherEventsDuringPits,
    tire_suitability: weatherSuitability,
    weather_risk: weatherEventsDuringPits > 1 ? "high" : weatherEventsDuringPits > 0 ? "medium" : "low"
  }
}

function calculateRiskScore(strategy: any, simulationResults: any[]) {
  let riskScore = 0.0
  
  // Time consistency risk
  const totalTimes = simulationResults.map(r => r.totalTime)
  const timeVariance = calculateVariance(totalTimes)
  riskScore += Math.min(timeVariance / 1000, 0.3)
  
  // Tire wear risk
  const tireAnalysis = analyzeTireWear(strategy, "dry", getTrackDetails("silverstone"))
  if (tireAnalysis.overall_wear_risk === "high") riskScore += 0.3
  else if (tireAnalysis.overall_wear_risk === "medium") riskScore += 0.15
  
  // Strategy complexity risk
  if (strategy.pit_stops.length > 2) riskScore += 0.2
  
  // Driver style risk
  if (strategy.driver_style === "aggressive") riskScore += 0.15
  else if (strategy.driver_style === "conservative") riskScore += 0.05
  
  return Math.min(riskScore, 1.0)
}

function calculateVariance(values: number[]) {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
}

function analyzeKeyDifferences(strategies: any[]) {
  const differences: any[] = []
  
  if (strategies.length < 2) return differences
  
  // Time differences
  const times = strategies.map(s => s.total_time)
  const timeRange = Math.max(...times) - Math.min(...times)
  if (timeRange > 5.0) {
    differences.push({
      type: "time_difference",
      description: `Time difference between fastest and slowest strategy: ${timeRange.toFixed(1)}s`,
      impact: timeRange > 10.0 ? "high" : "medium"
    })
  }
  
  // Tire strategy differences
  const tireStrategies = strategies.map(s => s.tires)
  const tireStrategyStrings = tireStrategies.map(s => JSON.stringify(s))
  const uniqueTireStrategies = tireStrategyStrings.filter((item, index) => tireStrategyStrings.indexOf(item) === index)
  if (uniqueTireStrategies.length > 1) {
    differences.push({
      type: "tire_strategy",
      description: "Different tire compound strategies used",
      impact: "medium"
    })
  }
  
  // Risk differences
  const riskScores = strategies.map(s => s.risk_score)
  const riskRange = Math.max(...riskScores) - Math.min(...riskScores)
  if (riskRange > 0.2) {
    differences.push({
      type: "risk_difference",
      description: `Significant risk difference between strategies: ${riskRange.toFixed(2)}`,
      impact: "medium"
    })
  }
  
  return differences
}

function generateOptimizationSuggestions(strategies: any[]) {
  const suggestions = []
  
  // Analyze tire wear
  const highWearStrategies = strategies.filter(s => s.tire_wear_analysis.overall_wear_risk === "high")
  if (highWearStrategies.length > 0) {
    suggestions.push("Consider reducing aggressive tire compounds to minimize wear risk")
  }
  
  // Analyze pit stop timing
  for (const strategy of strategies) {
    if (strategy.pit_stops.length > 2) {
      suggestions.push("Consider reducing number of pit stops to minimize time loss")
      break
    }
  }
  
  // Weather considerations
  const weatherSensitiveStrategies = strategies.filter(s => s.weather_impact.weather_risk === "high")
  if (weatherSensitiveStrategies.length > 0) {
    suggestions.push("Include weather-adaptive tire compounds for changing conditions")
  }
  
  // Risk management
  const highRiskStrategies = strategies.filter(s => s.risk_score > 0.6)
  if (highRiskStrategies.length > 0) {
    suggestions.push("Consider more conservative driver style to reduce risk")
  }
  
  return [...new Set(suggestions)] // Remove duplicates
}

function analyzeRisks(strategies: any[]) {
  const highRiskCount = strategies.filter(s => s.risk_score > 0.6).length
  const mediumRiskCount = strategies.filter(s => s.risk_score >= 0.3 && s.risk_score <= 0.6).length
  const lowRiskCount = strategies.filter(s => s.risk_score < 0.3).length
  const averageRisk = strategies.reduce((sum, s) => sum + s.risk_score, 0) / strategies.length
  
  return {
    high_risk_strategies: highRiskCount,
    medium_risk_strategies: mediumRiskCount,
    low_risk_strategies: lowRiskCount,
    average_risk: averageRisk,
    risk_distribution: {
      high: highRiskCount,
      medium: mediumRiskCount,
      low: lowRiskCount
    }
  }
}

function getTrackDetails(track_id: string) {
  const tracks: any = {
    silverstone: {
      total_laps: 52,
      lap_record: 78.871,
      tire_degradation: { "Soft": 1.0, "Medium": 1.1, "Hard": 1.2, "Intermediate": 1.0, "Wet": 1.2 }
    }
  }
  
  return tracks[track_id] || tracks.silverstone
} 