# DynamoDB Schema for User Subscriptions and Usage Tracking

## Overview
This document defines the DynamoDB table schemas for the F1 Race Sim usage tracking system. The tables are designed for optimal query performance and scalability.

## Table 1: User Subscriptions

**Table Name:** `f1-user-subscriptions-{environment}`

### Key Schema
- **Partition Key (HASH):** `user_id` (String)
- **Sort Key (RANGE):** `subscription_id` (String)

### Attributes
```json
{
  "user_id": "user_123",
  "subscription_id": "sub_456",
  "plan_id": "pro",
  "status": "active",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "stripe_subscription_id": "sub_stripe_789",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Global Secondary Indexes
1. **SubscriptionIdIndex**
   - Partition Key: `subscription_id`
   - Projection: ALL

### Sample Queries
```typescript
// Get user's current subscription
const subscription = await dynamodb.get({
  TableName: 'f1-user-subscriptions-dev',
  Key: { user_id: 'user_123', subscription_id: 'sub_456' }
}).promise()

// Get all subscriptions for a user
const subscriptions = await dynamodb.query({
  TableName: 'f1-user-subscriptions-dev',
  KeyConditionExpression: 'user_id = :userId',
  ExpressionAttributeValues: { ':userId': 'user_123' }
}).promise()
```

## Table 2: User Usage

**Table Name:** `f1-user-usage-{environment}`

### Key Schema
- **Partition Key (HASH):** `user_id` (String)
- **Sort Key (RANGE):** `feature_date_key` (String) - Format: `{feature}_{YYYY-MM-DD}`

### Attributes
```json
{
  "user_id": "user_123",
  "feature_date_key": "simulations_2024-01-15",
  "feature_name": "simulations",
  "usage_count": 2,
  "reset_date": "2024-01-16",
  "limit_value": 3,
  "created_at": "2024-01-15T00:00:00Z",
  "updated_at": "2024-01-15T12:30:00Z"
}
```

### Global Secondary Indexes
1. **FeatureDateIndex**
   - Partition Key: `feature_name`
   - Sort Key: `reset_date`
   - Projection: ALL

2. **ResetDateIndex**
   - Partition Key: `reset_date`
   - Sort Key: `user_id`
   - Projection: ALL

### Sample Queries
```typescript
// Get user's current usage for a feature
const usage = await dynamodb.get({
  TableName: 'f1-user-usage-dev',
  Key: { 
    user_id: 'user_123', 
    feature_date_key: 'simulations_2024-01-15' 
  }
}).promise()

// Get all usage for a user
const allUsage = await dynamodb.query({
  TableName: 'f1-user-usage-dev',
  KeyConditionExpression: 'user_id = :userId',
  ExpressionAttributeValues: { ':userId': 'user_123' }
}).promise()

// Get all users with usage for a specific feature and date
const featureUsage = await dynamodb.query({
  TableName: 'f1-user-usage-dev',
  IndexName: 'FeatureDateIndex',
  KeyConditionExpression: 'feature_name = :feature AND reset_date = :date',
  ExpressionAttributeValues: { 
    ':feature': 'simulations', 
    ':date': '2024-01-15' 
  }
}).promise()

// Get all usage that needs to be reset on a specific date
const resetUsage = await dynamodb.query({
  TableName: 'f1-user-usage-dev',
  IndexName: 'ResetDateIndex',
  KeyConditionExpression: 'reset_date = :date',
  ExpressionAttributeValues: { ':date': '2024-01-15' }
}).promise()
```

## Table 3: User Actions Log

**Table Name:** `f1-user-actions-log-{environment}`

### Key Schema
- **Partition Key (HASH):** `user_id` (String)
- **Sort Key (RANGE):** `timestamp` (String) - ISO 8601 format

### Attributes
```json
{
  "user_id": "user_123",
  "timestamp": "2024-01-15T12:30:00Z",
  "action_type": "simulation_run",
  "action_details": {
    "track": "monaco",
    "weather": "dry",
    "strategy": "strategy_789"
  },
  "plan_id": "free",
  "feature": "simulations",
  "usage_before": 1,
  "usage_after": 2
}
```

### Global Secondary Indexes
1. **ActionTypeIndex**
   - Partition Key: `action_type`
   - Sort Key: `timestamp`
   - Projection: ALL

2. **TimestampIndex**
   - Partition Key: `timestamp`
   - Sort Key: `user_id`
   - Projection: ALL

### Sample Queries
```typescript
// Get user's action history
const actions = await dynamodb.query({
  TableName: 'f1-user-actions-log-dev',
  KeyConditionExpression: 'user_id = :userId',
  ExpressionAttributeValues: { ':userId': 'user_123' },
  ScanIndexForward: false // Most recent first
}).promise()

// Get all actions of a specific type
const simulationActions = await dynamodb.query({
  TableName: 'f1-user-actions-log-dev',
  IndexName: 'ActionTypeIndex',
  KeyConditionExpression: 'action_type = :actionType',
  ExpressionAttributeValues: { ':actionType': 'simulation_run' },
  ScanIndexForward: false
}).promise()

// Get actions within a time range
const timeRangeActions = await dynamodb.query({
  TableName: 'f1-user-actions-log-dev',
  IndexName: 'TimestampIndex',
  KeyConditionExpression: 'timestamp BETWEEN :start AND :end',
  ExpressionAttributeValues: { 
    ':start': '2024-01-01T00:00:00Z', 
    ':end': '2024-01-31T23:59:59Z' 
  }
}).promise()
```

## Data Access Patterns

### 1. **Check Usage Before Action**
```typescript
// 1. Get user's current subscription
const subscription = await getSubscription(userId)

// 2. Check current usage for feature
const usage = await getUsage(userId, feature, date)

// 3. Compare with plan limits
if (usage.usage_count >= subscription.limits[feature]) {
  throw new Error('Usage limit exceeded')
}

// 4. Allow action and increment usage
await incrementUsage(userId, feature, date)

// 5. Log the action
await logAction(userId, actionType, details, subscription.plan_id)
```

### 2. **Daily Usage Reset**
```typescript
// 1. Query all usage that needs reset
const usageToReset = await dynamodb.query({
  TableName: 'f1-user-usage-dev',
  IndexName: 'ResetDateIndex',
  KeyConditionExpression: 'reset_date = :today',
  ExpressionAttributeValues: { ':today': today }
}).promise()

// 2. Delete old usage records
for (const item of usageToReset.Items) {
  await dynamodb.delete({
    TableName: 'f1-user-usage-dev',
    Key: { user_id: item.user_id, feature_date_key: item.feature_date_key }
  }).promise()
}
```

### 3. **Usage Analytics**
```typescript
// Get usage summary for a user
const usageSummary = await Promise.all([
  getUsage(userId, 'simulations', today),
  getUsage(userId, 'ai_recommendations', today),
  getUsage(userId, 'strategies', today)
])

// Get plan upgrade recommendations
const highUsageUsers = await dynamodb.query({
  TableName: 'f1-user-usage-dev',
  IndexName: 'FeatureDateIndex',
  KeyConditionExpression: 'feature_name = :feature AND reset_date = :date',
  FilterExpression: 'usage_count >= :threshold',
  ExpressionAttributeValues: { 
    ':feature': 'simulations', 
    ':date': today,
    ':threshold': 2 
  }
}).promise()
```

## Deployment

### 1. **Deploy with SAM**
```bash
cd infra/
sam build
sam deploy --guided
```

### 2. **Verify Tables Created**
```bash
aws dynamodb list-tables --region us-east-1
```

### 3. **Test Table Access**
```bash
# Test subscription table
aws dynamodb scan --table-name f1-user-subscriptions-dev --region us-east-1

# Test usage table
aws dynamodb scan --table-name f1-user-usage-dev --region us-east-1

# Test actions log table
aws dynamodb scan --table-name f1-user-actions-log-dev --region us-east-1
```

## Cost Optimization

### 1. **Billing Mode**
- Using `PAY_PER_REQUEST` for predictable costs
- No minimum capacity charges
- Pay only for actual requests

### 2. **Index Optimization**
- Only essential indexes created
- Minimal projection to reduce storage costs
- Consider removing unused indexes in production

### 3. **TTL for Old Data**
- Consider adding TTL for old action logs
- Keep usage data for current period only
- Archive old data to S3 for analytics

## Security

### 1. **IAM Policies**
- Lambda functions have minimal required permissions
- No public access to tables
- Encryption at rest enabled by default

### 2. **Data Validation**
- Validate all input data before writing
- Use conditional expressions for updates
- Implement proper error handling

This DynamoDB schema provides a scalable, cost-effective foundation for tracking user subscriptions and usage while maintaining excellent query performance for all access patterns.
