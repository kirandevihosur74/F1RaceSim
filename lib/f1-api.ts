// F1 API Integration with Jolpi API and fallback to local data
export interface JolpiCircuit {
  circuitId: string
  url: string
  circuitName: string
  Location: {
    lat: string
    long: string
    locality: string
    country: string
  }
}

export interface JolpiFastestLap {
  season: string
  round: string
  url: string
  raceName: string
  Circuit: {
    circuitId: string
    url: string
    circuitName: string
    Location: {
      lat: string
      long: string
      locality: string
      country: string
    }
  }
  date: string
  time: string
  FastestLap: {
    rank: string
    lap: string
    Time: {
      time: string
    }
    AverageSpeed: {
      units: string
      speed: string
    }
  }
}

export interface JolpiRace {
  season: string
  round: string
  url: string
  raceName: string
  Circuit: JolpiCircuit
  date: string
  time: string
  Results: Array<{
    number: string
    position: string
    positionText: string
    points: string
    Driver: {
      driverId: string
      permanentNumber: string
      code: string
      url: string
      givenName: string
      familyName: string
      dateOfBirth: string
      nationality: string
    }
    Constructor: {
      constructorId: string
      url: string
      name: string
      nationality: string
    }
    grid: string
    laps: string
    status: string
    Time: {
      millis: string
      time: string
    }
    FastestLap: {
      rank: string
      lap: string
      Time: {
        time: string
      }
      AverageSpeed: {
        units: string
        speed: string
      }
    }
  }>
}

// Local fallback data
const LOCAL_TRACK_DATA = {
  monaco: {
    id: "monaco",
    name: "Circuit de Monaco",
    country: "Monaco",
    circuit_length: 3.337,
    total_laps: 78,
    lap_record: 71.381,
    sectors: [
      { name: "Sector 1", length: 0.35, base_time: 25.0, tire_wear_factor: 0.8, fuel_consumption_factor: 0.9 },
      { name: "Sector 2", length: 0.40, base_time: 28.5, tire_wear_factor: 1.2, fuel_consumption_factor: 1.1 },
      { name: "Sector 3", length: 0.25, base_time: 17.9, tire_wear_factor: 0.9, fuel_consumption_factor: 0.8 }
    ],
    tire_degradation: { "Soft": 0.7, "Medium": 0.8, "Hard": 0.9, "Intermediate": 1.0, "Wet": 1.1 },
    weather_sensitivity: 0.3,
    overtaking_difficulty: 0.9
  },
  silverstone: {
    id: "silverstone",
    name: "Silverstone Circuit",
    country: "Great Britain",
    circuit_length: 5.891,
    total_laps: 52,
    lap_record: 78.871,
    sectors: [
      { name: "Sector 1", length: 0.33, base_time: 26.0, tire_wear_factor: 1.1, fuel_consumption_factor: 1.0 },
      { name: "Sector 2", length: 0.34, base_time: 27.5, tire_wear_factor: 1.3, fuel_consumption_factor: 1.2 },
      { name: "Sector 3", length: 0.33, base_time: 25.4, tire_wear_factor: 1.0, fuel_consumption_factor: 0.9 }
    ],
    tire_degradation: { "Soft": 1.0, "Medium": 1.1, "Hard": 1.2, "Intermediate": 1.0, "Wet": 1.2 },
    weather_sensitivity: 0.7,
    overtaking_difficulty: 0.4
  },
  spa: {
    id: "spa",
    name: "Circuit de Spa-Francorchamps",
    country: "Belgium",
    circuit_length: 7.004,
    total_laps: 44,
    lap_record: 103.588,
    sectors: [
      { name: "Sector 1", length: 0.40, base_time: 41.0, tire_wear_factor: 1.4, fuel_consumption_factor: 1.3 },
      { name: "Sector 2", length: 0.35, base_time: 36.0, tire_wear_factor: 1.2, fuel_consumption_factor: 1.1 },
      { name: "Sector 3", length: 0.25, base_time: 26.6, tire_wear_factor: 1.0, fuel_consumption_factor: 0.9 }
    ],
    tire_degradation: { "Soft": 1.3, "Medium": 1.4, "Hard": 1.5, "Intermediate": 1.1, "Wet": 1.3 },
    weather_sensitivity: 0.8,
    overtaking_difficulty: 0.3
  },
  monza: {
    id: "monza",
    name: "Autodromo Nazionale di Monza",
    country: "Italy",
    circuit_length: 5.793,
    total_laps: 53,
    lap_record: 80.872,
    sectors: [
      { name: "Sector 1", length: 0.30, base_time: 24.0, tire_wear_factor: 0.7, fuel_consumption_factor: 0.8 },
      { name: "Sector 2", length: 0.40, base_time: 32.0, tire_wear_factor: 0.8, fuel_consumption_factor: 0.9 },
      { name: "Sector 3", length: 0.30, base_time: 24.9, tire_wear_factor: 0.6, fuel_consumption_factor: 0.7 }
    ],
    tire_degradation: { "Soft": 0.6, "Medium": 0.7, "Hard": 0.8, "Intermediate": 1.0, "Wet": 1.1 },
    weather_sensitivity: 0.5,
    overtaking_difficulty: 0.2
  },
  suzuka: {
    id: "suzuka",
    name: "Suzuka International Racing Course",
    country: "Japan",
    circuit_length: 5.807,
    total_laps: 53,
    lap_record: 81.581,
    sectors: [
      { name: "Sector 1", length: 0.35, base_time: 28.5, tire_wear_factor: 1.1, fuel_consumption_factor: 1.0 },
      { name: "Sector 2", length: 0.30, base_time: 24.5, tire_wear_factor: 1.2, fuel_consumption_factor: 1.1 },
      { name: "Sector 3", length: 0.35, base_time: 28.6, tire_wear_factor: 1.0, fuel_consumption_factor: 0.9 }
    ],
    tire_degradation: { "Soft": 1.1, "Medium": 1.2, "Hard": 1.3, "Intermediate": 1.0, "Wet": 1.2 },
    weather_sensitivity: 0.6,
    overtaking_difficulty: 0.5
  }
}

// Track coordinates for weather API
const TRACK_COORDINATES = {
  monaco: { lat: 43.7347, lon: 7.4206 },
  silverstone: { lat: 52.0736, lon: -1.0167 },
  spa: { lat: 50.4372, lon: 5.9714 },
  monza: { lat: 45.6206, lon: 9.2854 },
  suzuka: { lat: 34.8431, lon: 136.5412 }
}

// F1 API functions using Jolpi API
export class F1APIService {
  private static readonly JOLPI_BASE_URL = 'https://api.jolpi.ca/ergast/f1'
  private static readonly WEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

  // Get all circuits from Jolpi API
  static async getCircuits(): Promise<JolpiCircuit[]> {
    try {
      const response = await fetch(`${this.JOLPI_BASE_URL}/circuits.json`)
      if (!response.ok) {
        throw new Error('Jolpi API failed')
      }
      
      const data = await response.json()
      return data.MRData?.CircuitTable?.Circuits || []
    } catch (error) {
      console.error('Failed to fetch circuits from Jolpi API:', error)
      return []
    }
  }

  // Get fastest lap for a specific circuit
  static async getFastestLap(circuitId: string): Promise<JolpiFastestLap | null> {
    try {
      const response = await fetch(`${this.JOLPI_BASE_URL}/circuits/${circuitId}/fastest/1/drivers.json`)
      if (!response.ok) throw new Error('Failed to fetch fastest lap')
      
      const data = await response.json()
      const races = data.MRData?.RaceTable?.Races || []
      return races.length > 0 ? races[0] : null
    } catch (error) {
      console.error('Failed to fetch fastest lap from Jolpi API:', error)
      return null
    }
  }

  // Get race results for a specific circuit
  static async getRaceResults(circuitId: string, year: string = '2023'): Promise<JolpiRace | null> {
    try {
      const response = await fetch(`${this.JOLPI_BASE_URL}/${year}/circuits/${circuitId}/results.json`)
      if (!response.ok) throw new Error('Failed to fetch race results')
      
      const data = await response.json()
      const races = data.MRData?.RaceTable?.Races || []
      return races.length > 0 ? races[0] : null
    } catch (error) {
      console.error('Failed to fetch race results from Jolpi API:', error)
      return null
    }
  }

  // Transform Jolpi circuit data to our format
  static transformCircuitData(circuits: JolpiCircuit[]): any[] {
    return circuits.map(circuit => ({
      id: circuit.circuitId,
      name: circuit.circuitName,
      country: circuit.Location.country,
      locality: circuit.Location.locality,
      coordinates: {
        lat: parseFloat(circuit.Location.lat),
        lon: parseFloat(circuit.Location.long)
      }
    }))
  }

  // Get weather data for a track
  static async getWeatherData(trackId: string): Promise<any> {
    const coords = TRACK_COORDINATES[trackId as keyof typeof TRACK_COORDINATES]
    if (!coords || !this.WEATHER_API_KEY) {
      return this.generateSimulatedWeather(trackId)
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${this.WEATHER_API_KEY}&units=metric`
      )
      
      if (!response.ok) throw new Error('Failed to fetch weather data')
      
      const weatherData = await response.json()
      return this.transformWeatherData(weatherData, trackId)
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
      return this.generateSimulatedWeather(trackId)
    }
  }

  // Transform OpenWeatherMap data to our format
  private static transformWeatherData(weatherData: any, trackId: string): any {
    const condition = this.mapWeatherCondition(weatherData.weather[0].main)
    const temperature = weatherData.main.temp
    const humidity = weatherData.main.humidity
    const windSpeed = weatherData.wind.speed

    return {
      condition,
      temperature,
      humidity,
      wind_speed: windSpeed,
      rain_probability: condition === 'wet' ? 0.8 : condition === 'intermediate' ? 0.4 : 0.1,
      track_temperature: temperature + 10 + (Math.random() - 0.5) * 4,
      grip_level: condition === 'dry' ? 1.0 : condition === 'intermediate' ? 0.85 : 0.7
    }
  }

  // Map OpenWeatherMap conditions to our format
  private static mapWeatherCondition(weatherMain: string): string {
    switch (weatherMain.toLowerCase()) {
      case 'rain':
      case 'drizzle':
        return 'wet'
      case 'clouds':
      case 'mist':
        return 'intermediate'
      case 'clear':
      case 'sun':
      default:
        return 'dry'
    }
  }

  // Generate simulated weather as fallback
  private static generateSimulatedWeather(trackId: string): any {
    const conditions = ['dry', 'intermediate', 'wet']
    const condition = conditions[Math.floor(Math.random() * conditions.length)]
    
    return {
      condition,
      temperature: 20 + (Math.random() - 0.5) * 10,
      humidity: 40 + Math.random() * 40,
      wind_speed: 5 + Math.random() * 15,
      rain_probability: condition === 'wet' ? 0.8 : condition === 'intermediate' ? 0.4 : 0.1,
      track_temperature: 25 + (Math.random() - 0.5) * 8,
      grip_level: condition === 'dry' ? 1.0 : condition === 'intermediate' ? 0.85 : 0.7
    }
  }

  // Get track data with Jolpi API fallback
  static async getTrackData(trackId: string): Promise<any> {
    // First try to get from local data
    const localTrack = LOCAL_TRACK_DATA[trackId as keyof typeof LOCAL_TRACK_DATA]
    if (localTrack) {
      return localTrack
    }

    // If not in local data, try to get from Jolpi API
    try {
      const circuits = await this.getCircuits()
      const circuit = circuits.find(c => c.circuitId === trackId)
      
      if (circuit) {
        // Get additional data from API
        const fastestLap = await this.getFastestLap(trackId)
        const raceResults = await this.getRaceResults(trackId)
        
        return {
          id: circuit.circuitId,
          name: circuit.circuitName,
          country: circuit.Location.country,
          locality: circuit.Location.locality,
          coordinates: {
            lat: parseFloat(circuit.Location.lat),
            lon: parseFloat(circuit.Location.long)
          },
          lap_record: fastestLap ? this.parseLapTime(fastestLap.FastestLap.Time.time) : 0,
          total_laps: raceResults ? parseInt(raceResults.Results[0]?.laps || '0') : 0,
          // Use default values for missing data
          circuit_length: 5.0, // Would need additional API calls
          sectors: [
            { name: "Sector 1", length: 0.33, base_time: 25.0, tire_wear_factor: 1.0, fuel_consumption_factor: 1.0 },
            { name: "Sector 2", length: 0.34, base_time: 28.0, tire_wear_factor: 1.1, fuel_consumption_factor: 1.0 },
            { name: "Sector 3", length: 0.33, base_time: 25.0, tire_wear_factor: 1.0, fuel_consumption_factor: 1.0 }
          ],
          tire_degradation: { "Soft": 1.0, "Medium": 1.1, "Hard": 1.2, "Intermediate": 1.0, "Wet": 1.2 },
          weather_sensitivity: 0.6,
          overtaking_difficulty: 0.5
        }
      }
    } catch (error) {
      console.error('Failed to get track data from Jolpi API:', error)
    }

    // Return null if track not found
    return null
  }

  // Parse lap time string to seconds
  private static parseLapTime(timeString: string): number {
    const parts = timeString.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1])
    }
    return parseFloat(timeString)
  }

  // Get all available tracks (local + Jolpi API)
  static async getAllTracks(): Promise<any[]> {
    const localTracks = Object.values(LOCAL_TRACK_DATA)
    
    try {
      const apiCircuits = await this.getCircuits()
      const apiTracks = this.transformCircuitData(apiCircuits)
      
      // Merge local and API data, prioritizing local data for known tracks
      const mergedTracks = [...localTracks]
      
      apiTracks.forEach(apiTrack => {
        const existingTrack = mergedTracks.find(t => t.id === apiTrack.id)
        if (!existingTrack) {
          mergedTracks.push({
            ...apiTrack,
            circuit_length: 5.0, // Default value
            total_laps: 50, // Default value
            lap_record: 80.0, // Default value
            sectors: [
              { name: "Sector 1", length: 0.33, base_time: 25.0, tire_wear_factor: 1.0, fuel_consumption_factor: 1.0 },
              { name: "Sector 2", length: 0.34, base_time: 28.0, tire_wear_factor: 1.1, fuel_consumption_factor: 1.0 },
              { name: "Sector 3", length: 0.33, base_time: 25.0, tire_wear_factor: 1.0, fuel_consumption_factor: 1.0 }
            ],
            tire_degradation: { "Soft": 1.0, "Medium": 1.1, "Hard": 1.2, "Intermediate": 1.0, "Wet": 1.2 },
            weather_sensitivity: 0.6,
            overtaking_difficulty: 0.5
          })
        }
      })
      
      return mergedTracks
    } catch (error) {
      console.error('Failed to get tracks from Jolpi API, using local data only:', error)
      return localTracks
    }
  }

  // Test Jolpi API connectivity
  static async testAPIConnectivity(): Promise<{ available: boolean; endpoint: string; error?: string }> {
    try {
      const response = await fetch(`${this.JOLPI_BASE_URL}/circuits.json`)
      if (response.ok) {
        return { available: true, endpoint: this.JOLPI_BASE_URL }
      } else {
        return { 
          available: false, 
          endpoint: this.JOLPI_BASE_URL, 
          error: `Jolpi API returned status ${response.status}` 
        }
      }
    } catch (error) {
      console.error('Jolpi API test failed:', error)
      return { 
        available: false, 
        endpoint: this.JOLPI_BASE_URL, 
        error: 'Jolpi API is unavailable' 
      }
    }
  }
} 