# Usage Tracking System Implementation Guide

## Overview
This guide explains how to implement the complete user subscription and usage tracking system for the F1 Race Sim application.

## What We've Built

### 1. **Database Schema** (`docs/database-schema.md`)
- User subscriptions table
- Usage tracking table  
- Action logging table
- Proper relationships and constraints

### 2. **Usage Tracking Service** (`lib/usageTracking.ts`)
- Singleton service for managing usage
- Feature limit checking
- Usage incrementing and resetting
- Cache-based performance optimization

### 3. **API Endpoints**
- `/api/users/subscription` - Manage user subscriptions
- `/api/users/usage` - Track and check usage limits

### 4. **React Hook** (`lib/hooks/useUsage.ts`)
- Easy integration with React components
- Automatic usage fetching and caching
- Error handling and loading states

### 5. **Usage Display Component** (`components/UsageDisplay.tsx`)
- Visual representation of current usage
- Progress bars and limits
- Upgrade prompts

## Next Steps to Complete Implementation

### 1. **Database Setup**
```sql
-- Run the SQL from database-schema.md in your database
-- This creates the necessary tables for tracking
```

### 2. **Update Usage Tracking Service**
Replace the TODO comments in `lib/usageTracking.ts`:

```typescript
// Replace this:
// TODO: Update database
console.log(`Incremented usage for user ${userId}, feature ${feature}: ${current + 1}`)

// With actual database calls:
await db.userUsage.upsert({
  where: { unique_user_feature_date: { userId, feature, resetDate } },
  update: { usage_count: { increment: 1 } },
  create: { userId, feature, usage_count: 1, resetDate, limit_value: limit }
})
```

### 3. **Integrate with Authentication**
Update `lib/hooks/useUsage.ts` to get the actual user plan:

```typescript
// Replace this:
const response = await fetch(`/api/users/usage?planId=free`) // TODO: Get actual plan

// With this:
const userPlan = await getUserPlan(userId)
const response = await fetch(`/api/users/usage?planId=${userPlan}`)
```

### 4. **Add Usage Tracking to All Features**
Update these components to use usage tracking:

- **StrategyComparison.tsx** - Track strategy comparisons
- **StrategyRecommendations.tsx** - Track AI recommendations
- **RaceStrategyForm.tsx** - Already updated for simulations

### 5. **Add Usage Display to Main Page**
Add the `UsageDisplay` component to your main dashboard:

```tsx
import UsageDisplay from '../components/UsageDisplay'

// In your main page layout:
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="md:col-span-2">
    {/* Your main content */}
  </div>
  <div>
    <UsageDisplay />
  </div>
</div>
```

### 6. **Implement Plan Enforcement**
Add middleware to your API routes:

```typescript
// In your simulation API
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check usage before allowing simulation
  const usageCheck = await usageTracker.checkUsage(
    session.user.id, 
    'simulations', 
    userPlan
  )
  
  if (!usageCheck.allowed) {
    return NextResponse.json({ 
      error: 'Daily simulation limit reached',
      details: usageCheck 
    }, { status: 429 })
  }

  // Allow simulation to proceed
  // ... rest of your simulation logic
}
```

### 7. **Add Usage Reset Cron Job**
Create a scheduled task to reset usage counters:

```typescript
// scripts/reset-usage.js
import { usageTracker } from '../lib/usageTracking'

async function resetDailyUsage() {
  // Reset daily features (simulations)
  await usageTracker.resetUsage('all', 'simulations')
}

async function resetMonthlyUsage() {
  // Reset monthly features (strategies, AI recommendations)
  await usageTracker.resetUsage('all', 'strategies')
  await usageTracker.resetUsage('all', 'ai_recommendations')
}

// Run daily at midnight
setInterval(resetDailyUsage, 24 * 60 * 60 * 1000)

// Run monthly on the 1st
setInterval(resetMonthlyUsage, 30 * 24 * 60 * 60 * 1000)
```

## Testing the System

### 1. **Test Free Plan Limits**
- Create a free user account
- Try to run more than 3 simulations per day
- Verify the limit is enforced

### 2. **Test Feature Restrictions**
- Verify AI recommendations are limited to 1 for free users
- Check strategy limits (5 for free, 50 for pro)
- Test upgrade flow

### 3. **Test Usage Display**
- Verify usage counts are accurate
- Check progress bars update correctly
- Test reset functionality

## Monitoring and Analytics

### 1. **Usage Metrics**
Track these key metrics:
- Daily active users by plan
- Feature usage patterns
- Upgrade conversion rates
- Plan churn rates

### 2. **Error Monitoring**
Monitor for:
- Usage limit exceeded errors (429 responses)
- Failed usage tracking
- Database connection issues

## Security Considerations

### 1. **Rate Limiting**
- Implement API rate limiting
- Prevent usage manipulation
- Validate user sessions

### 2. **Data Validation**
- Sanitize all inputs
- Validate feature names
- Check user permissions

## Performance Optimization

### 1. **Caching**
- Cache usage data in Redis
- Implement cache invalidation
- Use connection pooling

### 2. **Database Indexing**
- Index on user_id + feature + reset_date
- Add composite indexes for common queries
- Monitor query performance

## Deployment Checklist

- [ ] Database schema created
- [ ] Usage tracking service implemented
- [ ] API endpoints deployed
- [ ] React components updated
- [ ] Usage display added to UI
- [ ] Plan enforcement implemented
- [ ] Cron jobs scheduled
- [ ] Monitoring configured
- [ ] Testing completed

## Support and Maintenance

### 1. **Regular Tasks**
- Monitor usage patterns
- Update plan limits as needed
- Backup usage data
- Performance optimization

### 2. **Troubleshooting**
- Check database connections
- Verify API responses
- Monitor error logs
- Test upgrade flows

This system provides a solid foundation for subscription-based feature access control while maintaining good user experience and performance.
