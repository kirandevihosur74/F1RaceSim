'use client'

import React from 'react'
import { useSession, signIn } from 'next-auth/react'
import { LogIn } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showAuthPrompt?: boolean
}

const ProtectedRoute = ({ children, fallback, showAuthPrompt = true }: ProtectedRouteProps) => {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    if (fallback) {
      return <>{fallback}</>
    }

    // Only show the full authentication prompt for the first ProtectedRoute
    if (showAuthPrompt) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-gray-400">User</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
            Please sign in with your Google account to access this feature.
          </p>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In with Google</span>
          </button>
        </div>
      )
    }

    // For subsequent ProtectedRoutes, just hide the content
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
