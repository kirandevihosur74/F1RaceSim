'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, CreditCard } from 'lucide-react'
import { pricingPlans, PricingPlan, PricingFeature } from '../lib/pricing'
import { useSession } from 'next-auth/react'

import { showSuccessToast, showErrorToast } from '../lib/toast'
import BackButton from './BackButton'
import PricingErrorBoundary from './PricingErrorBoundary'
import ClientErrorBoundary from './ClientErrorBoundary'

const PricingPage = () => {
  const { data: session } = useSession()
  

  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)
  const [waitlistStatus, setWaitlistStatus] = useState<{ onWaitlist: boolean; plan: string | null }>({ onWaitlist: false, plan: null })

  // Check user's waitlist status when component mounts with retry mechanism
  useEffect(() => {
    const checkWaitlistStatus = async (retryCount = 0, maxRetries = 3) => {
      if (session?.user) {
        try {
          console.log(`Checking waitlist status for user: ${session.user.email} (attempt ${retryCount + 1})`)
          const response = await fetch('/api/users/waitlist?action=check', {
            // Add cache control to prevent stale data issues
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Waitlist status response:', data)
            setWaitlistStatus(data)
          } else {
            console.warn(`Failed to check waitlist status: ${response.status}`)
            // Set default status on error
            setWaitlistStatus({ onWaitlist: false, plan: null })
          }
        } catch (error) {
          console.error(`Error checking waitlist status (attempt ${retryCount + 1}):`, error)
          
          // Retry with exponential backoff if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s
            console.log(`Retrying in ${delay}ms...`)
            setTimeout(() => checkWaitlistStatus(retryCount + 1, maxRetries), delay)
          } else {
            console.error('Max retries exceeded, setting default waitlist status')
            // Set default status to prevent crashes
            setWaitlistStatus({ onWaitlist: false, plan: null })
          }
        }
      } else {
        console.log('No session user, skipping waitlist check')
      }
    }

    // Wrap the entire function in a try-catch to catch any unexpected errors
    try {
      checkWaitlistStatus()
    } catch (error) {
      console.error('Unexpected error in waitlist status check:', error)
      // Set default status to prevent crashes
      setWaitlistStatus({ onWaitlist: false, plan: null })
    }
  }, [session?.user])

  // Add global error handler for this component
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error caught in PricingPage:', event.error)
      if (event.error && event.error.message && 
          (event.error.message.includes('pk.match') || 
           event.error.message.includes('ValidationException') ||
           event.error.message.includes('schema'))) {
        console.error('Database error detected in PricingPage')
        // Prevent the error from propagating
        event.preventDefault()
        // Set safe defaults
        setWaitlistStatus({ onWaitlist: false, plan: null })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in PricingPage:', event.reason)
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('pk.match') || 
           event.reason.message.includes('ValidationException') ||
           event.reason.message.includes('schema'))) {
        console.error('Database error detected in PricingPage promise rejection')
        // Prevent the error from propagating
        event.preventDefault()
        // Set safe defaults
        setWaitlistStatus({ onWaitlist: false, plan: null })
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const handleUpgrade = async (planId: string) => {
    if (!session?.user) {
      showErrorToast('Please sign in to join the waitlist')
      return
    }

    if (planId === 'free') {
      showErrorToast('You are already on the free plan')
      return
    }

    // Handle waitlist plans
    if (planId === 'pro' || planId === 'business') {
      try {
        const response = await fetch('/api/users/waitlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planId }),
        })
        
        if (response.ok) {
          const result = await response.json()
          showSuccessToast(result.message || 'You have been added to the waitlist! We will notify you when these plans are available.')
          // Update local waitlist status
          setWaitlistStatus({ onWaitlist: true, plan: planId })
        } else {
          const error = await response.json()
          showErrorToast(error.error || 'Failed to join waitlist. Please try again.')
        }
      } catch (error) {
        console.error('Error joining waitlist:', error)
        showErrorToast('Failed to join waitlist. Please try again.')
      }
      return
    }

    // For other plans, show a message that they're not available yet
    showErrorToast('This plan is not available yet. Please join the waitlist for Pro or Business plans.')
  }

  const getPlanPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free'
    
    // For Pro and Business plans, show "Join Waitlist" instead of price
    if (plan.id === 'pro' || plan.id === 'business') {
      return 'Join Waitlist'
    }
    
    return `$${plan.price}/month`
  }



  const renderFeature = (feature: PricingFeature) => (
    <div key={feature.id} className="flex items-center space-x-3">
      {feature.included ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <X className="w-5 h-5 text-gray-400" />
      )}
      <span className={`text-sm ${feature.included ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
        {feature.name}
      </span>
    </div>
  )

  const renderPlan = (plan: PricingPlan) => {
    const isCurrentPlan = false // TODO: Get from user subscription
    const isUpgrading = upgradingPlan === plan.id
    
    return (
      <div
        key={plan.id}
        className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-2xl border p-8 transition-all duration-300 ${
          plan.popular
            ? 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600'
            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
        } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
      >
        {plan.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </div>
          </div>
        )}



        <div className="text-center mb-8">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              {plan.name}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-base leading-relaxed">
            {plan.description}
          </p>
          <div className="mb-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              {getPlanPrice(plan)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {plan.features.map(renderFeature)}
        </div>

        <button
          onClick={() => handleUpgrade(plan.id)}
          disabled={isCurrentPlan || isUpgrading}
          className={`w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg ${
            isCurrentPlan
              ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : plan.id === 'pro' || plan.id === 'business'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
              : plan.popular
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-900 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 dark:text-gray-100'
          }`}
        >
          {isUpgrading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : plan.id === 'pro' || plan.id === 'business' ? (
            <>
              <span>Join Waitlist</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>{plan.cta}</span>
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <PricingErrorBoundary>
      <ClientErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <div className="mb-8">
              <BackButton />
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Choose Your Plan
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Unlock unlimited simulations, advanced analytics, and AI-powered strategy recommendations
              </p>
              
              {/* Waitlist Status */}
              {session?.user && waitlistStatus.onWaitlist && (
                <div className="mt-6 inline-flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <span className="text-purple-700 dark:text-purple-300 text-sm font-medium">
                    🕐 You're on the waitlist for {waitlistStatus.plan === 'pro' ? 'Pro' : 'Business'} plan
                  </span>
                </div>
              )}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map(renderPlan)}
            </div>

          </div>
        </div>
      </ClientErrorBoundary>
    </PricingErrorBoundary>
  )
}

export default PricingPage
