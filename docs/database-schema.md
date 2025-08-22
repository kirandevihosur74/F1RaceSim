# Database Schema for User Subscriptions and Usage Tracking

## Tables

### 1. users
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. user_subscriptions
```sql
CREATE TABLE user_subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id ENUM('free', 'pro', 'business') DEFAULT 'free',
  status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
  current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. user_usage
```sql
CREATE TABLE user_usage (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  usage_count INT DEFAULT 0,
  reset_date DATE NOT NULL,
  limit_value INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_feature_date (user_id, feature_name, reset_date)
);
```

### 4. user_actions_log
```sql
CREATE TABLE user_actions_log (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_details JSON,
  plan_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Feature Limits by Plan

### Free Plan
- simulations_per_day: 3
- strategies: 5
- ai_recommendations: 1

### Pro Plan  
- simulations_per_day: unlimited (-1)
- strategies: 50
- ai_recommendations: unlimited (-1)

### Business Plan
- simulations_per_day: unlimited (-1)
- strategies: unlimited (-1)
- ai_recommendations: unlimited (-1)

## Usage Tracking Features
- simulations
- ai_recommendations  
- strategies
- strategy_comparisons
