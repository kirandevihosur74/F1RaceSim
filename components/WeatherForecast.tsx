import React, { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'

const WeatherForecast: React.FC = () => {
  const {
    selectedTrack,
    weatherForecast,
    isLoading,
    isUsingAPIData,
    loadWeatherForecast
  } = useSimulationStore()

  useEffect(() => {
    if (selectedTrack) {
      loadWeatherForecast(selectedTrack)
    }
  }, [selectedTrack, loadWeatherForecast])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'wet':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'intermediate':
        return (
          <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
        )
      case 'dry':
      default:
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getGripLevelColor = (gripLevel: number) => {
    if (gripLevel >= 0.9) return 'text-green-600'
    if (gripLevel >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGripLevelText = (gripLevel: number) => {
    if (gripLevel >= 0.9) return 'Excellent'
    if (gripLevel >= 0.8) return 'Good'
    if (gripLevel >= 0.7) return 'Fair'
    return 'Poor'
  }

  if (!selectedTrack) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weather Forecast</h3>
        <div className="text-center text-gray-500 py-8">
          Please select a track to view weather forecast
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Weather Forecast</h3>
        
        {/* Data Source Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isUsingAPIData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-xs text-gray-600">
            {isUsingAPIData ? 'Real Weather' : 'Simulated'}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading weather data...</span>
        </div>
      )}

      {/* Weather Data */}
      {!isLoading && weatherForecast.length > 0 && (
        <div className="space-y-4">
          {/* Current Weather Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getWeatherIcon(weatherForecast[0].condition)}
                <div>
                  <h4 className="font-semibold text-gray-800 capitalize">
                    {weatherForecast[0].condition} Conditions
                  </h4>
                  <p className="text-sm text-gray-600">
                    Lap {weatherForecast[0].lap} - {weatherForecast.length} laps forecast
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">
                  {weatherForecast[0].temperature}°C
                </div>
                <div className="text-sm text-gray-600">
                  Track: {weatherForecast[0].track_temperature}°C
                </div>
              </div>
            </div>
          </div>

          {/* Weather Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="text-lg font-semibold text-gray-800">
                {weatherForecast[0].humidity}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Wind Speed</div>
              <div className="text-lg font-semibold text-gray-800">
                {weatherForecast[0].wind_speed} km/h
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Rain Probability</div>
              <div className="text-lg font-semibold text-gray-800">
                {Math.round(weatherForecast[0].rain_probability * 100)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Grip Level</div>
              <div className={`text-lg font-semibold ${getGripLevelColor(weatherForecast[0].grip_level)}`}>
                {getGripLevelText(weatherForecast[0].grip_level)}
              </div>
            </div>
          </div>

          {/* Weather Timeline */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Weather Timeline</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {weatherForecast.slice(0, 20).map((forecast, index) => (
                <div
                  key={forecast.lap}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-600">
                      Lap {forecast.lap}
                    </div>
                    {getWeatherIcon(forecast.condition)}
                    <div className="text-sm text-gray-800 capitalize">
                      {forecast.condition}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-gray-600">
                      {forecast.temperature}°C
                    </div>
                    <div className="text-gray-600">
                      {forecast.humidity}%
                    </div>
                    <div className={`font-medium ${getGripLevelColor(forecast.grip_level)}`}>
                      {getGripLevelText(forecast.grip_level)}
                    </div>
                  </div>
                </div>
              ))}
              {weatherForecast.length > 20 && (
                <div className="text-center text-sm text-gray-500 py-2">
                  +{weatherForecast.length - 20} more laps...
                </div>
              )}
            </div>
          </div>

          {/* Weather Impact Analysis */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Weather Impact Analysis</h4>
            <div className="text-sm text-blue-700 space-y-1">
              {weatherForecast[0].condition === 'wet' && (
                <>
                  <div>• Wet conditions require intermediate or wet tires</div>
                  <div>• Reduced grip levels affect cornering speeds</div>
                  <div>• Higher risk of aquaplaning in standing water</div>
                </>
              )}
              {weatherForecast[0].condition === 'intermediate' && (
                <>
                  <div>• Mixed conditions may require tire strategy adjustments</div>
                  <div>• Track conditions can change rapidly</div>
                  <div>• Monitor weather radar for rain probability</div>
                </>
              )}
              {weatherForecast[0].condition === 'dry' && (
                <>
                  <div>• Optimal conditions for dry weather tires</div>
                  <div>• Track temperature affects tire degradation</div>
                  <div>• Consider thermal management strategies</div>
                </>
              )}
            </div>
          </div>

          {/* Data Source Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Data Source:</span>
              <span className="font-medium">
                {isUsingAPIData ? 'OpenWeatherMap API' : 'Simulated Weather Model'}
              </span>
            </div>
            {!isUsingAPIData && (
              <div className="text-xs text-gray-500 mt-1">
                Using track-specific weather patterns and historical data
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Weather Data */}
      {!isLoading && weatherForecast.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No weather data available</div>
          <button
            onClick={() => loadWeatherForecast(selectedTrack)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}
    </div>
  )
}

export default WeatherForecast 