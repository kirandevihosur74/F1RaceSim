'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  isDatabaseError: boolean
}

class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      isDatabaseError: false 
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a database-related error
    const isDatabaseError = error.message.includes('pk.match') || 
                           error.message.includes('ValidationException') ||
                           error.message.includes('schema') ||
                           error.message.includes('undefined is not an object') ||
                           error.message.includes('Cannot read properties of undefined')
    
    console.error('ClientErrorBoundary caught error:', error.message, 'isDatabaseError:', isDatabaseError)
    
    return { 
      hasError: true, 
      error,
      isDatabaseError 
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ClientErrorBoundary caught an error:', error, errorInfo)
    
    const isDatabaseError = error.message.includes('pk.match') || 
                           error.message.includes('ValidationException') ||
                           error.message.includes('schema') ||
                           error.message.includes('undefined is not an object') ||
                           error.message.includes('Cannot read properties of undefined')
    
    if (isDatabaseError) {
      console.error('Database error detected in ClientErrorBoundary')
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
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false // Client-side errors are usually not fatal
        })
      }
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring:', monitoringError)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isDatabaseError: false })
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isDatabaseError) {
        // Special handling for database errors
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Temporary Database Issue
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>We're experiencing a temporary issue with our database. This is usually resolved quickly.</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm font-medium border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 font-medium">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-800 dark:text-red-200 overflow-auto">
                  <div><strong>Error:</strong> {this.state.error.toString()}</div>
                  <div><strong>Type:</strong> Client-side database error</div>
                  {this.state.errorInfo && (
                    <div><strong>Stack:</strong> {this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              </details>
            )}
          </div>
        )
      }

      // Default error handling for other errors
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 my-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Something went wrong
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>We encountered an unexpected error. Please try refreshing the page.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={this.handleRetry}
                  className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ClientErrorBoundary
