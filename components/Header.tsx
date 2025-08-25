import React, { useEffect, useState } from 'react'
import { Moon, Sun, LogIn } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLogoutTracking } from '../lib/hooks/useLogoutTracking'

interface HeaderProps {
  onOpenLogin: () => void
}

const Header = ({ onOpenLogin }: HeaderProps) => {
  const [isDark, setIsDark] = useState(false)
  const { data: session, status } = useSession()
  const { handleLogout } = useLogoutTracking()

  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const handleThemeToggle = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const handleSignOut = async () => {
    try {
      await handleLogout()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const renderAuthSection = () => {
    if (status === 'loading') {
      return (
        <div className="flex items-center space-x-2 px-4 py-2 text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      )
    }

    if (session?.user) {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {session.user.email?.split('@')[0]}@...
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={onOpenLogin}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign In</span>
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex justify-center py-4">
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg px-8 py-3 flex items-center justify-between min-w-[600px] max-w-4xl">
        {/* Left side - Logo and App Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">🏎️</span>
          </div>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            F1 Race Sim
          </span>
        </div>

        {/* Center - Navigation Links */}
        <nav className="flex items-center space-x-6">
          <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            Pricing
          </Link>
          {session?.user && (
            <Link href="/admin" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              Admin
            </Link>
          )}
        </nav>

        {/* Right side - User Section and Theme Toggle */}
        <div className="flex items-center space-x-4">
          {renderAuthSection()}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header 