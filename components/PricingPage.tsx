'use client'

import React from 'react'
import { Check, X } from 'lucide-react'
import { pricingPlans, PricingPlan, PricingFeature } from '../lib/pricing'
import { useSession } from 'next-auth/react'
import BackButton from './BackButton'

const PricingPage = () => {
  const { data: session } = useSession()

  const handleUpgrade = (planId: string) => {
    if (!session?.user) {
      // Redirect to login if not authenticated
      return
    }
    
    // TODO: Implement Stripe checkout
    console.log(`Upgrading to ${planId} plan`)
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
              {plan.price === 0 ? 'Free' : `$${plan.price}`}
            </span>
            {plan.price > 0 && (
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                /month
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {plan.features.map(renderFeature)}
        </div>

        <button
          onClick={() => handleUpgrade(plan.id)}
          disabled={isCurrentPlan}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isCurrentPlan
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-not-allowed'
              : plan.popular
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : plan.cta}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <BackButton href="/" label="Back to Dashboard" variant="outlined" />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade as you need more features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map(renderPlan)}
        </div>
      </div>
    </div>
  )
}

export default PricingPage
