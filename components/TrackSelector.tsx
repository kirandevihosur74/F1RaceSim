'use client'

import React, { useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCode } from 'country-list'

const getFlagUrl = (country: string) => {
  const manualMap: Record<string, string> = {
    uk: 'gb',
    'great britain': 'gb',
    gb: 'gb',
    usa: 'us',
    'u.s.a.': 'us',
    'u.s.': 'us',
    us: 'us',
    turkey: 'tr',
    'türkiye': 'tr',
  }
  const key = country.trim().toLowerCase()
  const code = manualMap[key] || getCode(country.trim())?.toLowerCase() || 'un'
  return `https://flagcdn.com/${code}.svg`
}

const TrackSelector = () => {
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

  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="bg-white dark:bg-[#181f2a] rounded-2xl shadow-lg p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Track Selection</h3>
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

      <div className="relative">
        <button
          ref={prevRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#232b39] border border-gray-300 dark:border-gray-700 rounded-full shadow p-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition disabled:opacity-30"
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
            setTimeout(() => {
              if (swiper.params && swiper.params.navigation) {
                // @ts-ignore
                swiper.params.navigation.prevEl = prevRef.current
                // @ts-ignore
                swiper.params.navigation.nextEl = nextRef.current
                swiper.navigation.init()
                swiper.navigation.update()
              }
            })
          }}
          spaceBetween={24}
          slidesPerView={3}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="w-full"
        >
          {availableTracks.map((track) => (
            <SwiperSlide key={track.id}>
              <button
                className={`
                  relative bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col justify-between
                  border-2 border-gray-200 dark:border-gray-700 w-full h-[260px] text-left transition overflow-hidden
                  text-gray-900 dark:text-gray-100
                  ${selectedTrack === track.id 
                    ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-500' 
                    : 'hover:border-blue-400 hover:shadow-lg'}
                `}
                onClick={() => handleTrackChange(track.id)}
                style={{ zIndex: selectedTrack === track.id ? 1 : 0 }}
              >
                <img
                  src={getFlagUrl(track.country)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none rounded-xl"
                  style={{ filter: 'grayscale(30%)', opacity: 0.15 }}
                />
                
                <div className="relative z-10 flex flex-col h-full justify-between p-6">
                  <div>
                    <h2 className="font-bold text-2xl mb-1 text-gray-900 dark:text-white leading-tight drop-shadow-md">{track.name}</h2>
                    <div className="text-xs text-gray-400 dark:text-gray-300 mb-4">{track.country}</div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full">
                    <div className="relative group w-full">
                      <span className="block w-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded cursor-help">
                        Weather: {Math.round(track.weather_sensitivity * 100)}%
                      </span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                        Historical likelihood of variable weather at this circuit. Not a real-time forecast.
                      </div>
                    </div>
                    
                    <div className="relative group w-full">
                      <span className="block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded cursor-help">
                        Overtaking: {track.overtaking_difficulty < 0.3 ? 'Easy' : track.overtaking_difficulty < 0.7 ? 'Medium' : 'Hard'}
                      </span>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 rounded shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                        How difficult it is to overtake at this circuit, based on layout and history.
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedTrack === track.id && (
                  <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow z-20">Selected</span>
                )}
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
        
        <button
          ref={nextRef}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#232b39] border border-gray-300 dark:border-gray-700 rounded-full shadow p-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition disabled:opacity-30"
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
        <div className="mt-6 p-5 bg-blue-50 dark:bg-[#232b39] rounded-xl border border-blue-100 dark:border-gray-700">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <span className="dark:text-gray-100">{availableTracks.find(t => t.id === selectedTrack)?.name}</span>
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-400">Circuit Length:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{availableTracks.find(t => t.id === selectedTrack)?.circuit_length}km</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-400">Total Laps:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{availableTracks.find(t => t.id === selectedTrack)?.total_laps}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-400">Lap Record:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{availableTracks.find(t => t.id === selectedTrack)?.lap_record}s</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-400">Weather Sensitivity:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{availableTracks.find(t => t.id === selectedTrack)?.weather_sensitivity}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackSelector 