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
  isHydrationError: boolean
  retryCount: number
}

class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      isHydrationError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a hydration or database-related error
    const isHydrationError = error.message.includes('pk.match') || 
                            error.message.includes('ValidationException') ||
                            error.message.includes('schema') ||
                            error.message.includes('undefined is not an object') ||
                            error.message.includes('Cannot read properties of undefined') ||
                            error.message.includes('hydration') ||
                            error.message.includes('Hydration')
    
    console.error('HydrationErrorBoundary caught error:', error.message, 'isHydrationError:', isHydrationError)
    
    return { 
      hasError: true, 
      error,
      isHydrationError,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HydrationErrorBoundary caught an error:', error, errorInfo)
    
    const isHydrationError = error.message.includes('pk.match') || 
                            error.message.includes('ValidationException') ||
                            error.message.includes('schema') ||
                            error.message.includes('undefined is not an object') ||
                            error.message.includes('Cannot read properties of undefined') ||
                            error.message.includes('hydration') ||
                            error.message.includes('Hydration')
    
    if (isHydrationError) {
      console.error('Hydration error detected in HydrationErrorBoundary')
      // Log to monitoring service if available
      this.logErrorToMonitoring(error, errorInfo)
    }
    
    this.setState({
      error,
      errorInfo,
      isHydrationError
    })
  }

  logErrorToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false // Hydration errors are usually not fatal
        })
      }
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring:', monitoringError)
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state
    if (retryCount < 3) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined, 
        isHydrationError: false,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // After 3 retries, force a page reload
      window.location.reload()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isHydrationError) {
        // Special handling for hydration errors
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Page Loading Issue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We encountered an issue while loading this page. This is usually temporary and can be resolved by refreshing.
              </p>
              <div className="space-y-2">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {this.state.retryCount < 3 ? 'Try Again' : 'Final Attempt'}
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
              </div>
              {this.state.retryCount > 0 && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  Attempt {this.state.retryCount} of 3
                </p>
              )}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                    <div><strong>Error:</strong> {this.state.error.toString()}</div>
                    <div><strong>Type:</strong> Hydration error</div>
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
      if (this.props.fallback) {
        return this.props.fallback
      }

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
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default HydrationErrorBoundary
