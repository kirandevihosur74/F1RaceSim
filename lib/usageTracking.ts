import { getCurrentUserPlan, PricingPlan } from './pricing'

export interface UsageLimit {
  feature: string
  current: number
  limit: number
  resetDate: Date
  isUnlimited: boolean
}

export interface UsageCheck {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  resetDate: Date
  message?: string
}

export class UsageTracker {
  private static instance: UsageTracker
  private usageCache: Map<string, Map<string, number>> = new Map()

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker()
    }
    return UsageTracker.instance
  }

  /**
   * Check if user can perform an action based on their plan
   */
  async checkUsage(
    userId: string,
    feature: string,
    planId: string = 'free'
  ): Promise<UsageCheck> {
    const plan = getCurrentUserPlan(planId)
    const limit = this.getFeatureLimit(plan, feature)
    
    if (limit === -1) {
      return {
        allowed: true,
        current: 0,
        limit: -1,
        remaining: -1,
        resetDate: new Date(),
        message: 'Unlimited'
      }
    }

    const current = await this.getCurrentUsage(userId, feature)
    const resetDate = this.getResetDate(feature)
    
    console.log(`Usage check for ${feature}:`, {
      userId,
      planId,
      limit,
      current,
      allowed: current < limit
    })
    
    return {
      allowed: current < limit,
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetDate,
      message: current >= limit ? `Limit reached. Resets on ${resetDate.toLocaleDateString()}` : undefined
    }
  }

  /**
   * Increment usage count for a feature
   */
  async incrementUsage(userId: string, feature: string): Promise<void> {
    const current = await this.getCurrentUsage(userId, feature)
    const resetDate = this.getResetDate(feature)
    
    // Update cache
    if (!this.usageCache.has(userId)) {
      this.usageCache.set(userId, new Map())
    }
    const userCache = this.usageCache.get(userId)!
    userCache.set(feature, current + 1)

    // TODO: Update database
    console.log(`Incremented usage for user ${userId}, feature ${feature}: ${current + 1}`)
  }

  /**
   * Get current usage count for a feature
   */
  private async getCurrentUsage(userId: string, feature: string): Promise<number> {
    // Check cache first
    if (this.usageCache.has(userId)) {
      const userCache = this.usageCache.get(userId)!
      if (userCache.has(feature)) {
        const cachedValue = userCache.get(feature)!
        
        // Check if we need to reset (daily for simulations)
        if (feature === 'simulations') {
          const lastReset = this.getResetDate(feature)
          const now = new Date()
          
          // If it's a new day, reset the usage
          if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
            console.log(`Resetting daily usage for ${feature} - new day detected`)
            userCache.delete(feature)
            return 0
          }
        }
        
        return cachedValue
      }
    }

    // For new users or first-time usage, return 0
    // This ensures free users can run their first simulation
    return 0
  }

  /**
   * Get feature limit based on plan
   */
  private getFeatureLimit(plan: PricingPlan, feature: string): number {
    switch (feature) {
      case 'simulations':
        return plan.limits.simulationsPerDay
      case 'strategies':
        return plan.limits.strategies
      case 'ai_recommendations':
        // Check if feature is included in plan
        const aiFeature = plan.features.find(f => f.id === 'ai-recommendations')
        if (!aiFeature?.included) return 0
        // Free plan gets 3, others unlimited
        return plan.id === 'free' ? 3 : -1
      default:
        return 0
    }
  }

  /**
   * Get reset date for feature (daily for simulations, monthly for others)
   */
  private getResetDate(feature: string): Date {
    const now = new Date()
    
    if (feature === 'simulations') {
      // Reset daily at midnight
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else {
      // Reset monthly on the 1st
      return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }
  }

  /**
   * Reset usage for a user (called when reset date is reached)
   */
  async resetUsage(userId: string, feature: string): Promise<void> {
    if (this.usageCache.has(userId)) {
      const userCache = this.usageCache.get(userId)!
      userCache.delete(feature)
    }
    
    // TODO: Reset in database
    console.log(`Reset usage for user ${userId}, feature ${feature}`)
  }

  /**
   * Get usage summary for a user
   */
  async getUsageSummary(userId: string, planId: string): Promise<UsageLimit[]> {
    const plan = getCurrentUserPlan(planId)
    const features = ['simulations', 'strategies', 'ai_recommendations']
    const summary: UsageLimit[] = []

    for (const feature of features) {
      const current = await this.getCurrentUsage(userId, feature)
      const limit = this.getFeatureLimit(plan, feature)
      const resetDate = this.getResetDate(feature)

      summary.push({
        feature,
        current,
        limit,
        resetDate,
        isUnlimited: limit === -1
      })
    }

    return summary
  }
}

export const usageTracker = UsageTracker.getInstance()
