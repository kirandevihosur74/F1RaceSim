'use client'

import React from 'react'
import BackButton from '../../components/BackButton'
import { BarChart3, Users, Smartphone } from 'lucide-react'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button */}
      <div className="p-6">
        <BackButton href="/" label="Back to Dashboard" variant="outlined" />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
            Discover all the amazing features coming to F1 Race Sim
          </p>

          {/* Coming Soon GIF */}
          <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-blue-500"></div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-600">
                  <img 
                    src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" 
                    alt="Racing Features Coming Soon" 
                    className="w-72 h-72 object-cover rounded-xl"
                  />
                </div>
              </div>
              
              <div className="text-center max-w-3xl">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-blue-500 text-white rounded-full text-sm font-medium mb-6 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Coming Soon
                </div>
                
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-6">
                  Amazing Features Ahead
                </h2>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  I'm working hard to bring you amazing new features. Stay tuned for updates on 
                  <span className="font-semibold text-red-600 dark:text-red-400"> advanced race analytics</span>, 
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> team management</span>, 
                  and much more!
                </p>
              </div>
            </div>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Detailed race statistics and performance metrics with real-time insights
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Team Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Manage multiple drivers and team strategies with collaborative tools
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Smartphone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Mobile App
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Native mobile app for iOS and Android with offline capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
