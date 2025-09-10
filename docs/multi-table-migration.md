# Multi-Table Architecture Migration

## Overview

The F1 Race Sim application has been migrated from a single-table architecture to a multi-table architecture for better data organization, scalability, and performance.

## Table Structure

### 1. **f1-user-subscriptions-dev**
**Purpose:** User subscription management
**Key Schema:**
- Partition Key: `user_id` (String)
- Sort Key: `subscription_id` (String)
- Attributes: `plan_id`, `status`, `current_period_start`, `current_period_end`, `stripe_subscription_id`

### 2. **f1-user-usage-dev**
**Purpose:** Feature usage tracking and rate limiting
**Key Schema:**
- Partition Key: `user_id` (String)
- Sort Key: `feature_date_key` (String) - Format: `{feature}_{YYYY-MM-DD}`
- Attributes: `feature_name`, `usage_count`, `reset_date`, `limit_value`

### 3. **f1-user-actions-log-dev**
**Purpose:** User action logging and analytics
**Key Schema:**
- Partition Key: `user_id` (String)
- Sort Key: `timestamp` (String)
- Attributes: `action_type`, `action_details`, `plan_id`

### 4. **f1-simulation-results**
**Purpose:** Simulation data storage
**Key Schema:**
- Partition Key: `simulation_id` (String)
- Sort Key: `created_at` (String)
- Attributes: `user_id`, `track_id`, `strategy_data`, `results`, `total_time`

### 5. **f1-strategy-metadata-dev** (Legacy)
**Purpose:** User profiles and legacy data (backward compatibility)
**Key Schema:**
- Partition Key: `strategy_id` (String)
- Attributes: `user_id`, `type`, `email`, `name`, etc.

## Changes Made

### API Routes Updated

1. **`/api/users/usage`** - Now uses `f1-user-usage-dev`
2. **`/api/users/subscription`** - Now uses `f1-user-subscriptions-dev`
3. **Plan Security Module** - Updated to use new tables with fallback to legacy table

### Environment Variables

Added new environment variables:
```bash
USER_SUBSCRIPTIONS_TABLE=f1-user-subscriptions-dev
USER_USAGE_TABLE=f1-user-usage-dev
USER_ACTIONS_LOG_TABLE=f1-user-actions-log-dev
SIMULATION_RESULTS_TABLE=f1-simulation-results
```

### Backward Compatibility

The system maintains backward compatibility by:
- Checking new tables first
- Falling back to `f1-strategy-metadata-dev` if data not found
- Gradually migrating data as users interact with the system

## Benefits

1. **Better Performance:** Dedicated tables for specific data types
2. **Scalability:** Each table can be scaled independently
3. **Data Organization:** Clear separation of concerns
4. **Query Optimization:** Optimized indexes for specific use cases
5. **Maintenance:** Easier to maintain and debug specific features

## Migration Strategy

1. **Phase 1:** ✅ Update API routes to use new tables
2. **Phase 2:** ✅ Update environment variables
3. **Phase 3:** ✅ Update plan security module
4. **Phase 4:** 🔄 Update action logging (pending)
5. **Phase 5:** 🔄 Update simulation results storage (pending)
6. **Phase 6:** 🔄 Data migration script (pending)

## Next Steps

1. Create the DynamoDB tables using the infrastructure templates
2. Test the new architecture with existing users
3. Monitor performance and adjust as needed
4. Complete remaining API route updates
5. Create data migration scripts for existing users

## Testing

To test the new architecture:
1. Set up the new environment variables
2. Create the DynamoDB tables
3. Test user registration and subscription management
4. Test usage tracking and rate limiting
5. Verify backward compatibility with existing data
