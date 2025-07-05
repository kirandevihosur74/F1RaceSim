import React, { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'

// Helper to get flag emoji by country name
const getFlag = (country: string) => {
  const flags: Record<string, string> = {
    Monaco: '🇲🇨',
    'Great Britain': '🇬🇧',
    Belgium: '🇧🇪',
    Italy: '🇮🇹',
    Japan: '🇯🇵',
    Australia: '🇦🇺',
    Morocco: '🇲🇦',
    UK: '🇬🇧',
    // Add more as needed
  }
  return flags[country] || '🏁'
}

const TrackSelector: React.FC = () => {
  const {
    selectedTrack,
    availableTracks,
    isLoading,
    apiError,
    setSelectedTrack,
    loadAvailableTracks
  } = useSimulationStore()

  useEffect(() => {
    loadAvailableTracks()
  }, [loadAvailableTracks])

  const handleTrackChange = (trackId: string) => {
    setSelectedTrack(trackId)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Track Selection</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-600">API Data</span>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">{apiError}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">Loading tracks...</span>
          </div>
        </div>
      )}

      {/* Track Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {availableTracks.map((track) => (
          <button
            key={track.id}
            className={`
              relative bg-white rounded-xl shadow-md p-6 flex flex-col items-start
              border-2 w-full min-w-[220px] max-w-xs min-h-[200px] text-left transition overflow-hidden
              ${selectedTrack === track.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'}
            `}
            onClick={() => handleTrackChange(track.id)}
            style={{ zIndex: selectedTrack === track.id ? 1 : 0 }}
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{getFlag(track.country)}</span>
              <span className="font-bold text-lg break-words">{track.name}</span>
            </div>
            <div className="text-gray-500 text-xs mb-1">{track.country}</div>
            <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-2">
              <span>Length: <b>{track.circuit_length}km</b></span>
              <span>Laps: <b>{track.total_laps}</b></span>
              <span>Record: <b>{track.lap_record}s</b></span>
            </div>
            {/* Badges row at the bottom */}
            <div className="flex gap-2 mt-auto">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Weather {Math.round(track.weather_sensitivity * 100)}%</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Overtaking: {track.overtaking_difficulty < 0.3 ? 'Easy' : track.overtaking_difficulty < 0.7 ? 'Medium' : 'Hard'}</span>
            </div>
            {selectedTrack === track.id && (
              <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Selected</span>
            )}
          </button>
        ))}
      </div>

      {availableTracks.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No tracks available</div>
          <button
            onClick={loadAvailableTracks}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      )}

      {selectedTrack && (
        <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            {getFlag(availableTracks.find(t => t.id === selectedTrack)?.country || '')}
            {availableTracks.find(t => t.id === selectedTrack)?.name}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Circuit Length:</span>
              <span className="ml-2 font-semibold">{availableTracks.find(t => t.id === selectedTrack)?.circuit_length}km</span>
            </div>
            <div>
              <span className="text-blue-700">Total Laps:</span>
              <span className="ml-2 font-semibold">{availableTracks.find(t => t.id === selectedTrack)?.total_laps}</span>
            </div>
            <div>
              <span className="text-blue-700">Lap Record:</span>
              <span className="ml-2 font-semibold">{availableTracks.find(t => t.id === selectedTrack)?.lap_record}s</span>
            </div>
            <div>
              <span className="text-blue-700">Weather Sensitivity:</span>
              <span className="ml-2 font-semibold">{availableTracks.find(t => t.id === selectedTrack)?.weather_sensitivity}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackSelector 