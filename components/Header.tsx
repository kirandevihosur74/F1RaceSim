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
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
          >
            Sign Out
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
    <header className="sticky top-0 z-50 flex justify-center py-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-8 py-4 flex items-center justify-between min-w-[800px] max-w-6xl">
        {/* Left side - Logo and App Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white text-xl font-bold">🏎️</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            F1 Race Sim
          </span>
        </div>

        {/* Center - Navigation Links */}
        <nav className="flex items-center space-x-8">
          <Link href="/pricing" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            Pricing
          </Link>
          <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            Features
          </Link>
          {session?.user && (
            <Link href="/admin" className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Admin
            </Link>
          )}
          <Link href="/docs" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            Docs
          </Link>
        </nav>

        {/* Right side - Buttons */}
        <div className="flex items-center space-x-3">
          {renderAuthSection()}
          <button
            onClick={handleThemeToggle}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-yellow-500" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header 