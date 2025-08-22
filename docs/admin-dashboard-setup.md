# Admin Dashboard Setup Guide

## Overview
The Admin Dashboard provides comprehensive user tracking, system monitoring, and administrative controls for the F1 Race Sim application.

## Features

### 🎯 **User Management**
- View all registered users
- Track user plans (Free, Pro, Business)
- Monitor user activity and usage
- Search and filter users
- Export user data to CSV

### 📊 **Usage Analytics**
- Total users by plan
- Simulation counts
- AI recommendation usage
- Strategy creation tracking
- User engagement metrics

### 🔧 **System Health**
- Database status monitoring
- API health checks
- Lambda function status
- S3 bucket monitoring
- System uptime tracking

### 📈 **Real-time Monitoring**
- Live user activity
- System performance metrics
- Error tracking and alerts
- Resource utilization

## Setup Instructions

### 1. **Configure Admin Access**
Edit `lib/admin.ts` and add your email address:

```typescript
export const ADMIN_EMAILS = [
  'your-actual-email@gmail.com', // Replace with your email
  'admin@f1racesim.com'          // Add additional admin emails
]
```

### 2. **Access the Dashboard**
- Sign in to your account
- Click the "Admin" link in the header (only visible to admins)
- Navigate to `/admin` route

### 3. **API Endpoints**
The dashboard uses these protected API endpoints:

- `GET /api/admin/users` - Fetch user data and statistics
- `GET /api/admin/system-health` - Get system health status

### 4. **Security Features**
- **Role-based access control** - Only configured admin emails can access
- **Session validation** - Must be authenticated to view admin data
- **API protection** - All admin endpoints require admin privileges

## Usage

### **Viewing Users**
1. Navigate to the Admin Dashboard
2. Use search to find specific users
3. Filter by plan type (Free, Pro, Business)
4. Sort by various criteria (last active, created date, usage)
5. Click the eye icon to view user details

### **Monitoring System Health**
1. Check the System Health section
2. Monitor database, API, and Lambda status
3. View performance metrics
4. Track uptime and last backup times

### **Exporting Data**
1. Click "Export Data" button
2. Download CSV file with user information
3. Use for analytics, reporting, or customer support

### **Refreshing Data**
1. Click "Refresh" button to update all data
2. Data automatically refreshes on page load
3. Real-time updates for critical metrics

## Customization

### **Adding New Metrics**
1. Update the `UsageStats` interface in `AdminDashboard.tsx`
2. Add new fields to the stats cards
3. Update the API endpoints to include new data

### **Modifying Admin Features**
1. Edit `lib/admin.ts` to enable/disable features
2. Update feature permissions as needed
3. Add new admin roles if required

### **Styling Changes**
1. Modify the Tailwind CSS classes in `AdminDashboard.tsx`
2. Update color schemes and layouts
3. Add new UI components as needed

## Integration with Real Data

### **Current Status**
- ✅ **UI Components** - Complete admin dashboard interface
- ✅ **API Endpoints** - Protected admin APIs created
- ✅ **Access Control** - Admin role checking implemented
- ⚠️ **Data Source** - Currently using mock data

### **Next Steps to Connect Real Data**

1. **Update DynamoDB Queries**
   ```typescript
   // In app/api/admin/users/route.ts
   // Replace mock data with actual DynamoDB queries
   const users = await dynamodb.scan({
     TableName: 'f1-user-subscriptions-dev'
   }).promise()
   ```

2. **Add Real System Health Checks**
   ```typescript
   // In app/api/admin/system-health/route.ts
   // Add actual AWS service health checks
   const dbHealth = await checkDynamoDBHealth()
   const lambdaHealth = await checkLambdaHealth()
   ```

3. **Implement Real-time Updates**
   ```typescript
   // Add WebSocket or polling for live updates
   useEffect(() => {
     const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
     return () => clearInterval(interval)
   }, [])
   ```

## Troubleshooting

### **Common Issues**

1. **"Forbidden - Admin access required"**
   - Check your email is in `ADMIN_EMAILS` array
   - Ensure you're signed in with the correct account

2. **Dashboard not loading**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check authentication status

3. **Data not updating**
   - Click refresh button
   - Check API response status
   - Verify DynamoDB table access

### **Debug Mode**
Enable debug logging by adding to your environment:

```bash
# .env.local
NEXT_PUBLIC_DEBUG=true
ADMIN_DEBUG=true
```

## Security Best Practices

1. **Regular Access Review**
   - Periodically review admin email list
   - Remove access for inactive admins
   - Use least privilege principle

2. **Audit Logging**
   - Log all admin actions
   - Monitor for suspicious activity
   - Regular security reviews

3. **Data Protection**
   - Encrypt sensitive user data
   - Implement data retention policies
   - Regular backup procedures

## Support

For admin dashboard issues:
1. Check the browser console for errors
2. Verify your email is in the admin list
3. Check API endpoint responses
4. Review DynamoDB table permissions

The admin dashboard provides powerful tools for monitoring and managing your F1 Race Sim application. Use it responsibly and ensure proper access controls are maintained.
