import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { useSimulationStore } from '@/store/simulationStore'

const SimulationResultsChart: React.FC = () => {
  const { simulationResults } = useSimulationStore()

  if (!simulationResults) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Simulation Results</h2>
        <div className="text-center py-12 text-gray-500">
          <p>Run a simulation to see results</p>
        </div>
      </div>
    )
  }

  const formatLapTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = (time % 60).toFixed(1)
    return `${minutes}:${seconds.padStart(4, '0')}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">Lap {label}</p>
          <p className="text-f1-red">
            Lap Time: {formatLapTime(payload[0].value)}
          </p>
          <p className="text-f1-blue">
            Tire Wear: {payload[1]?.value?.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Simulation Results</h2>
      
      <div className="space-y-6">
        {/* Lap Times Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lap Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={simulationResults.simulation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="lap" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatLapTime(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="lap_time"
                stroke="#E10600"
                strokeWidth={2}
                dot={{ fill: '#E10600', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: '#E10600', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tire Wear Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tire Wear</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={simulationResults.simulation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="lap" 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Tire Wear']}
                labelFormatter={(label) => `Lap ${label}`}
              />
              <Area
                type="monotone"
                dataKey="tire_wear"
                stroke="#1E3A8A"
                fill="#1E3A8A"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        {simulationResults.total_time && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Race Time</p>
              <p className="text-xl font-bold text-f1-red">
                {formatLapTime(simulationResults.total_time)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Average Lap Time</p>
              <p className="text-xl font-bold text-f1-blue">
                {formatLapTime(simulationResults.total_time / simulationResults.simulation.length)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimulationResultsChart 