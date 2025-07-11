import React from 'react'
import { Trophy, Settings, BarChart3 } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-f1-red rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">F1 Race Simulator</h1>
              <p className="text-sm text-gray-600">AI-Powered Strategy Analysis</p>
            </div>
          </div>
          
          {/* Remove the Analytics and Settings buttons */}
        </div>
      </div>
    </header>
  )
}

export default Header 