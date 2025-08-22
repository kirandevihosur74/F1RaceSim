import { NextRequest, NextResponse } from 'next/server'
import { F1APIService } from '../../../lib/f1-api'

// Force dynamic rendering to prevent static optimization errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const trackId = searchParams.get('track_id')
    const useAPI = searchParams.get('use_api') !== 'false'

    switch (action) {
      case 'list':
        // Get all available tracks
        const tracks = await F1APIService.getAllTracks()
        return NextResponse.json({ tracks })

      case 'details':
        // Get specific track details
        if (!trackId) {
          return NextResponse.json(
            { error: 'Track ID is required' },
            { status: 400 }
          )
        }
        
        const trackData = await F1APIService.getTrackData(trackId)
        if (!trackData) {
          return NextResponse.json(
            { error: 'Track not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({ track: trackData })

      case 'weather':
        // Get weather data for a track
        if (!trackId) {
          return NextResponse.json(
            { error: 'Track ID is required' },
            { status: 400 }
          )
        }
        
        const weatherData = await F1APIService.getWeatherData(trackId)
        return NextResponse.json({ weather: weatherData })

      case 'status':
        // Check API status
        try {
          const circuits = await F1APIService.getCircuits()
          const isAPIAvailable = circuits.length > 0
          
          return NextResponse.json({
            api_available: isAPIAvailable,
            circuits_count: circuits.length,
            using_api: useAPI && isAPIAvailable
          })
        } catch (error) {
          return NextResponse.json({
            api_available: false,
            circuits_count: 0,
            using_api: false,
            error: 'API unavailable'
          })
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Tracks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, track_id, use_api = true } = body

    switch (action) {
      case 'refresh':
        // Refresh API data
        try {
          const circuits = await F1APIService.getCircuits()
          const isAPIAvailable = circuits.length > 0
          
          return NextResponse.json({
            success: true,
            api_available: isAPIAvailable,
            circuits_count: circuits.length
          })
        } catch (error) {
          return NextResponse.json({
            success: false,
            api_available: false,
            error: 'Failed to refresh API data'
          })
        }

      case 'weather_forecast':
        // Generate weather forecast for a track
        if (!track_id) {
          return NextResponse.json(
            { error: 'Track ID is required' },
            { status: 400 }
          )
        }
        
        const weatherData = await F1APIService.getWeatherData(track_id)
        const forecast = generateWeatherForecast(weatherData, track_id)
        
        return NextResponse.json({ forecast })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Tracks API POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate weather forecast
function generateWeatherForecast(weatherData: any, trackId: string) {
  const forecast = []
  const totalLaps = 50 // Default
  
  for (let lap = 1; lap <= totalLaps; lap++) {
    // Use real weather as base and add some variation
    const variation = (Math.random() - 0.5) * 0.2
    const temperature = weatherData.temperature + variation * 5
    const humidity = Math.max(30, Math.min(90, weatherData.humidity + variation * 10))
    
    forecast.push({
      lap,
      condition: weatherData.condition,
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      wind_speed: weatherData.wind_speed + (Math.random() - 0.5) * 2,
      rain_probability: weatherData.rain_probability,
      track_temperature: temperature + 10 + (Math.random() - 0.5) * 4,
      grip_level: weatherData.grip_level
    })
  }
  
  return forecast
} 