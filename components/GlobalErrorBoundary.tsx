'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  isDatabaseError: boolean
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      isDatabaseError: false 
    }
  }

  static getDerivedStateFromError(error: Error): State {
    const isDatabaseError = error.message.includes('pk.match') || 
                           error.message.includes('ValidationException') ||
                           error.message.includes('schema') ||
                           error.message.includes('undefined is not an object')
    return { 
      hasError: true, 
      error,
      isDatabaseError 
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo)
    
    const isDatabaseError = error.message.includes('pk.match') || 
                           error.message.includes('ValidationException') ||
                           error.message.includes('schema') ||
                           error.message.includes('undefined is not an object')
    
    if (isDatabaseError) {
      console.error('Database error detected in GlobalErrorBoundary')
      // Log to monitoring service if available
      this.logErrorToMonitoring(error, errorInfo)
    }
    
    this.setState({
      error,
      errorInfo,
      isDatabaseError
    })
  }

  logErrorToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    // This could be sent to Sentry, LogRocket, or any monitoring service
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true
        })
      }
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring:', monitoringError)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isDatabaseError) {
        // Special handling for database errors
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Database Connection Issue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We're experiencing a temporary issue with our database. Our team has been notified and is working to resolve this.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                    <div><strong>Error:</strong> {this.state.error.toString()}</div>
                    <div><strong>Type:</strong> Database connection error</div>
                    {this.state.errorInfo && (
                      <div><strong>Stack:</strong> {this.state.errorInfo.componentStack}</div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        )
      }

      // Default error handling for other errors
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                  <div><strong>Error:</strong> {this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <div><strong>Stack:</strong> {this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary
