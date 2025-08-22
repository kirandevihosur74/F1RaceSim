'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
  variant?: 'default' | 'minimal' | 'outlined'
}

const BackButton = ({ 
  href, 
  label = 'Back', 
  className = '',
  variant = 'default'
}: BackButtonProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'
      case 'outlined':
        return 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white transition-colors'
    }
  }

  return (
    <button
      onClick={handleBack}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
        ${getVariantStyles()}
        ${className}
      `}
      aria-label={`Go back to previous page`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )
}

export default BackButton
