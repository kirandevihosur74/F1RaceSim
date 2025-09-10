import React from 'react'
import dynamic from 'next/dynamic'
import { useSimulationStore } from '../store/simulationStore'

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false })

const formatLapTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = (time % 60).toFixed(1).padStart(4, '0')
  return `${minutes}:${seconds}`
}

const formatTotalTime = (time: number) => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = (time % 60).toFixed(1).padStart(4, '0')
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
}

interface SimulationResultsChartProps {
  showCard?: boolean
}

const SimulationResultsChart: React.FC<SimulationResultsChartProps> = ({ showCard = true }) => {
  const {
    simulationResults,
    totalTime,
    strategyAnalysis,
    strategies,
    activeStrategyId,
    selectedTrack,
    availableTracks,
  } = useSimulationStore()

  const isDark = typeof window !== 'undefined' && (window.document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches)

  const strategy = strategies.find(s => s.id === activeStrategyId) || strategies[0]
  const track = availableTracks.find(t => t.id === selectedTrack)
  const weather = 'Dry'

  if (!simulationResults || simulationResults.length === 0) {
    const content = (
      <>
        {showCard && <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Simulation Results</h2>}
        <div className="text-center py-12 text-gray-500">
          <p>Run a simulation to see results</p>
        </div>
      </>
    )
    
    return showCard ? (
      <div className="card">
        {content}
      </div>
    ) : content
  }

  const laps = simulationResults.map(d => d.lap)
  const lapTimes = simulationResults.map(d => d.lap_time)
  const tireWear = simulationResults.map(d => d.tire_wear)
  const pitStops = strategy?.pit_stops || []
  const tireSequence = strategy?.tires?.join(' → ')
  const driverStyle = strategy?.driver_style
  const strategyName = strategy?.name

  const axisColor = isDark ? '#cbd5e1' : '#000000'
  const gridColor = isDark ? '#334155' : '#e5e7eb'
  const legendColor = isDark ? '#cbd5e1' : '#374151'
  
  const options = {
    chart: {
      id: 'f1-sim-results',
      toolbar: { show: false },
      zoom: { enabled: true },
      fontFamily: 'inherit',
      foreColor: axisColor,
    },
    stroke: { width: [3, 2], curve: 'smooth' as const },
    colors: ['#E10600', '#1E3A8A'],
    xaxis: {
      categories: laps,
      title: { text: 'Lap', style: { fontWeight: 600, fontSize: '14px', color: axisColor } },
      labels: { style: { fontSize: '12px', color: axisColor } },
      axisBorder: { color: gridColor },
      axisTicks: { color: gridColor },
    },
    yaxis: [
      {
        title: { text: 'Lap Time (mm:ss.s)', style: { fontWeight: 600, fontSize: '14px', color: axisColor } },
        labels: {
          formatter: (val: number) => formatLapTime(val),
          style: { fontSize: '12px', color: axisColor },
        },
        axisBorder: { color: gridColor },
        axisTicks: { color: gridColor },
      },
      {
        opposite: true,
        title: { text: 'Tire Wear (%)', style: { fontWeight: 600, fontSize: '14px', color: axisColor } },
        labels: {
          formatter: (val: number) => `${val.toFixed(1)}%`,
          style: { fontSize: '12px', color: axisColor },
        },
        min: 0,
        max: 100,
        axisBorder: { color: gridColor },
        axisTicks: { color: gridColor },
      },
    ],
    tooltip: {
      shared: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
        const lap = w.globals.categoryLabels[dataPointIndex]
        const lapTime = series[0][dataPointIndex]
        const tire = series[1][dataPointIndex]
        return `
          <div class='p-2'>
            <div class='font-semibold mb-1'>Lap ${lap}</div>
            <div class='text-f1-red'>Lap Time: ${formatLapTime(lapTime)}</div>
            <div class='text-f1-blue'>Tire Wear: ${tire !== undefined ? tire.toFixed(1) + '%' : 'N/A'}</div>
          </div>
        `
      }
    },
    legend: {
      show: true,
      position: 'top' as const,
      fontSize: '14px',
      fontWeight: 500,
      labels: { colors: axisColor },
    },
    annotations: {
      xaxis: pitStops.map((lap, idx) => ({
        x: lap,
        borderColor: '#FFB800',
        label: {
          style: { color: '#000', background: '#FFB800', fontWeight: 600 },
          text: `Pit Stop ${idx + 1}`,
        },
      })),
    },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 300 },
          legend: { fontSize: '12px' },
        },
      },
    ],
  }

  const series = [
    {
      name: 'Lap Time',
      type: 'line',
      data: lapTimes,
    },
    {
      name: 'Tire Wear',
      type: 'area',
      data: tireWear,
      yAxisIndex: 1,
    },
  ]

  const content = (
    <>
      {showCard && <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Simulation Results</h2>}
      
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-700 dark:text-gray-300 items-center">
        {track && <span><b>Track:</b> {track.name}</span>}
        <span><b>Weather:</b> {weather}</span>
        {tireSequence && <span><b>Tires:</b> {tireSequence}</span>}
        {driverStyle && <span><b>Driver Style:</b> {driverStyle.charAt(0).toUpperCase() + driverStyle.slice(1)}</span>}
        {strategyName && <span><b>Strategy:</b> {strategyName}</span>}
      </div>
      
      <div className="mb-8">
        <ApexCharts
          options={options}
          series={series}
          type="line"
          height={400}
        />
      </div>
      
      {totalTime && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Race Time</p>
            <p className="text-xl font-bold text-f1-red">
              {formatTotalTime(totalTime)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Lap Time</p>
            <p className="text-xl font-bold text-f1-blue">
              {formatLapTime(totalTime / simulationResults.length)}
            </p>
          </div>
        </div>
      )}
      
      {strategyAnalysis && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Strategy Analysis</h3>
          <p className="text-gray-700 dark:text-gray-300">{strategyAnalysis}</p>
        </div>
      )}
    </>
  )

  return showCard ? (
    <div className="card">
      {content}
    </div>
  ) : content
}

export default SimulationResultsChart 