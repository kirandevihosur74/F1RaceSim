import React, { useEffect, useState } from 'react'
import { Moon, Sun, LogIn, LogOut, Car } from 'lucide-react'
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {session.user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
            aria-label="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={onOpenLogin}
        className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
      >
        Sign In
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and App Name */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              F1 Race Sim
            </span>
          </div>

          {/* Center - Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-base">
              Pricing
            </Link>
            <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-base">
              Features
            </Link>
            {session?.user && (
              <Link href="/admin" className="text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold text-base px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                Admin
              </Link>
            )}
            <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium text-base">
              Docs
            </Link>
          </nav>

          {/* Right side - User Section and Theme Toggle */}
          <div className="flex items-center space-x-4">
            {renderAuthSection()}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 