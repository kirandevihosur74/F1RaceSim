import React, { useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  // Swiper custom navigation refs
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Track Selection</h3>
        <div className="flex items-center gap-2">
          
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

      {/* Swiper Carousel for Track Cards with custom navigation */}
      <div className="relative">
        {/* Custom Left Arrow */}
        <button
          ref={prevRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow p-2 hover:bg-blue-100 transition disabled:opacity-30"
          style={{ marginLeft: '-32px' }}
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6 text-blue-600" />
        </button>
        <Swiper
          modules={[Navigation]}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onInit={(swiper) => {
            // @ts-ignore
            swiper.params.navigation.prevEl = prevRef.current;
            // @ts-ignore
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
          }}
          spaceBetween={24}
          slidesPerView={3}
          className="w-full"
        >
          {availableTracks.map((track) => (
            <SwiperSlide key={track.id}>
              <button
                className={`
                  relative bg-white rounded-xl shadow-md p-6 flex flex-col items-start
                  border-2 w-full min-w-[220px] max-w-xs h-[260px] text-left transition overflow-x-hidden
                  ${selectedTrack === track.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'}
                `}
                onClick={() => handleTrackChange(track.id)}
                style={{ zIndex: selectedTrack === track.id ? 1 : 0 }}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getFlag(track.country)}</span>
                  <span className="font-bold text-lg break-words line-clamp-2">{track.name}</span>
                </div>
                <div className="text-gray-500 text-xs mb-1">{track.country}</div>
                <div className="flex flex-col gap-2 mt-auto w-full">
                  {/* Weather Sensitivity Badge with Tooltip */}
                  <div className="relative group w-full">
                    <span className="block w-full max-w-full bg-blue-50 text-blue-700 px-2 py-0.5 rounded cursor-help truncate">
                      Weather Sensitivity: {Math.round(track.weather_sensitivity * 100)}%
                    </span>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white text-xs text-gray-700 rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      Historical likelihood of variable weather at this circuit. Not a real-time forecast.
                    </div>
                  </div>
                  {/* Overtaking Badge with Tooltip */}
                  <div className="relative group w-full">
                    <span className="block w-full max-w-full bg-gray-100 text-gray-700 px-2 py-0.5 rounded cursor-help truncate">
                      Overtaking: {track.overtaking_difficulty < 0.3 ? 'Easy' : track.overtaking_difficulty < 0.7 ? 'Medium' : 'Hard'}
                    </span>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white text-xs text-gray-700 rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      How difficult it is to overtake at this circuit, based on layout and history.
                    </div>
                  </div>
                </div>
                {selectedTrack === track.id && (
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">Selected</span>
                )}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Custom Right Arrow */}
        <button
          ref={nextRef}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full shadow p-2 hover:bg-blue-100 transition disabled:opacity-30"
          style={{ marginRight: '-32px' }}
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6 text-blue-600" />
        </button>
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