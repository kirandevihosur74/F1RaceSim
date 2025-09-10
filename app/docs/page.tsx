'use client'

import React from 'react'
import BackButton from '../../components/BackButton'
import { Rocket, BookOpen, Target, Settings, Wrench, HelpCircle } from 'lucide-react'

export default function DocsPage() {
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
            Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
            Comprehensive guides and API documentation for F1 Race Sim
          </p>

          {/* Coming Soon GIF */}
          <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
            
            <div className="relative flex flex-col items-center justify-center">
              <div className="mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-600">
                  <img 
                    src="https://media.giphy.com/media/L1R1tvI9svkIWwpVYr/giphy.gif" 
                    alt="Documentation Coming Soon" 
                    className="w-72 h-72 object-cover rounded-xl"
                  />
                </div>
              </div>
              
              <div className="text-center max-w-3xl">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-medium mb-6 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Documentation Coming Soon
                </div>
                
                <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-6">
                  Comprehensive Guides Ahead
                </h2>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  I'm preparing comprehensive documentation including 
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> API guides</span>, 
                  <span className="font-semibold text-purple-600 dark:text-purple-400"> tutorials</span>, 
                  and best practices. Check back soon for detailed guides on how to get the most out of F1 Race Sim!
                </p>
              </div>
            </div>
          </div>

          {/* Documentation Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Getting Started
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Quick start guide and basic setup instructions to get you running
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                API Reference
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Complete API documentation and endpoints with examples
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Tutorials
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Step-by-step tutorials and practical examples
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Configuration
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Environment setup and configuration guides
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-yellow-200 dark:hover:border-yellow-800">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Development
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Developer guides and contribution guidelines
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl p-8 text-center transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <HelpCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                FAQ
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Frequently asked questions and troubleshooting guides
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
