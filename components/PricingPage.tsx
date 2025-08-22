'use client'

import React, { useState } from 'react'
import { Check, X, CreditCard } from 'lucide-react'
import { pricingPlans, PricingPlan, PricingFeature } from '../lib/pricing'
import { useSession } from 'next-auth/react'
import { useStripe } from '../lib/hooks/useStripe'
import { showSuccessToast, showErrorToast } from '../lib/toast'
import BackButton from './BackButton'

const PricingPage = () => {
  const { data: session } = useSession()
  const { createCheckoutSession, loading } = useStripe()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    if (!session?.user) {
      showErrorToast('Please sign in to upgrade your plan')
      return
    }

    if (planId === 'free') {
      showErrorToast('You are already on the free plan')
      return
    }

    try {
      setUpgradingPlan(planId)
      await createCheckoutSession(planId, billingCycle)
    } catch (error) {
      console.error('Error upgrading plan:', error)
      showErrorToast('Failed to start checkout. Please try again.')
    } finally {
      setUpgradingPlan(null)
    }
  }

  const getPlanPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free'
    
    if (billingCycle === 'yearly') {
      const yearlyPrice = Math.round(plan.price * 12 * 0.8) // 20% discount for yearly
      return `$${yearlyPrice}/year`
    }
    
    return `$${plan.price}/month`
  }

  const getSavingsBadge = (plan: PricingPlan) => {
    if (plan.price === 0 || billingCycle === 'monthly') return null
    
    const monthlyTotal = plan.price * 12
    const yearlyPrice = Math.round(plan.price * 12 * 0.8)
    const savings = monthlyTotal - yearlyPrice
    
    return (
      <div className="absolute -top-3 right-4">
        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Save ${savings}/year
        </div>
      </div>
    )
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
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md border p-6 ${
          plan.popular
            ? 'border-blue-500 dark:border-blue-400'
            : 'border-gray-200 dark:border-gray-700'
        } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </div>
          </div>
        )}

        {getSavingsBadge(plan)}

        <div className="text-center mb-6">
          <div className="text-center mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {plan.name}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
            {plan.description}
          </p>
          <div className="mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {getPlanPrice(plan)}
            </span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {plan.features.map(renderFeature)}
        </div>

        <button
          onClick={() => handleUpgrade(plan.id)}
          disabled={isCurrentPlan || isUpgrading || loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            isCurrentPlan
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-not-allowed'
              : plan.popular
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
          }`}
        >
          {isUpgrading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : isCurrentPlan ? (
            'Current Plan'
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
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-green-600">(20% off)</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map(renderPlan)}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            All plans include secure payment processing via Stripe. 
            Cancel or change your plan at any time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PricingPage
