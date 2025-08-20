# AWS Setup Guide for F1 Race Simulator

## Prerequisites
- AWS Account (free tier available)
- AWS CLI installed
- Python 3.11+ for backend deployment

## Step 1: AWS Account Setup

### Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the signup process
4. **Important**: Set up billing alerts to avoid unexpected charges

### Create IAM User
Instead of using root credentials, create a dedicated IAM user:

```bash
# Install AWS CLI if not already installed
brew install awscli  # macOS
# or
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your output format (json)
```

## Step 2: AWS Services Setup

### S3 Buckets
```bash
# Create S3 bucket for race data
aws s3 mb s3://f1-race-sim-data-$(date +%s)

# Create S3 bucket for static assets
aws s3 mb s3://f1-race-sim-assets-$(date +%s)
```

### DynamoDB Table
```bash
# Create DynamoDB table for simulation results
aws dynamodb create-table \
    --table-name f1-simulation-results \
    --attribute-definitions AttributeName=simulation_id,AttributeType=S \
    --key-schema AttributeName=simulation_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### Lambda Function
The SAM template will handle Lambda creation, but ensure:
- Lambda execution role has proper permissions
- Environment variables are configured

### API Gateway
Will be created automatically by SAM template.

## Step 3: Environment Variables

### Backend Environment
```bash
# Backend environment variables
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3 Buckets
S3_DATA_BUCKET=f1-race-sim-data-123456789
S3_ASSETS_BUCKET=f1-race-sim-assets-123456789

# DynamoDB
DYNAMODB_TABLE=f1-simulation-results

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Frontend
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

### Frontend Environment
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod
NEXT_PUBLIC_S3_BUCKET=f1-race-sim-assets-123456789
```

## Step 4: IAM Permissions

### Create IAM Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::f1-race-sim-data-*",
                "arn:aws:s3:::f1-race-sim-data-*/*",
                "arn:aws:s3:::f1-race-sim-assets-*",
                "arn:aws:s3:::f1-race-sim-assets-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/f1-simulation-results"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
```

### Attach Policy to Lambda Role
The SAM template will handle this automatically.

## Step 5: Deployment

### Install AWS SAM CLI
```bash
# macOS
brew install aws-sam-cli

# Linux
pip install aws-sam-cli
```

### Build and Deploy
```bash
# Build the SAM application
sam build

# Deploy to AWS
sam deploy --guided
```

### Verify Deployment
```bash
# List deployed resources
sam list resources

# Test the API
curl https://your-api-gateway-url.amazonaws.com/prod/health
```

## Step 6: Monitoring and Logging

### CloudWatch Logs
- Lambda function logs are automatically sent to CloudWatch
- Set up log retention policies
- Create CloudWatch alarms for errors

### Cost Monitoring
- Set up AWS Budgets
- Monitor Lambda execution costs
- Track S3 and DynamoDB usage

## Step 7: Security Best Practices

### Enable AWS CloudTrail
```bash
aws cloudtrail create-trail \
    --name f1-race-sim-trail \
    --s3-bucket-name f1-race-sim-data-123456789
```

### Enable S3 Versioning
```bash
aws s3api put-bucket-versioning \
    --bucket f1-race-sim-data-123456789 \
    --versioning-configuration Status=Enabled
```

### Enable DynamoDB Point-in-Time Recovery
```bash
aws dynamodb update-continuous-backups \
    --table-name f1-simulation-results \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

## Troubleshooting

### Common Issues
1. **Permission Denied** - Check IAM roles and policies
2. **Timeout Errors** - Increase Lambda timeout in SAM template
3. **Cold Start** - Use provisioned concurrency for better performance
4. **CORS Issues** - Configure API Gateway CORS settings

### Useful Commands
```bash
# Check Lambda function status
aws lambda get-function --function-name f1-race-sim-api

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/f1-race-sim

# Test S3 access
aws s3 ls s3://f1-race-sim-data-123456789/

# Check DynamoDB table
aws dynamodb describe-table --table-name f1-simulation-results
```

## Cost Estimation

### Free Tier (First 12 months)
- Lambda: 1M requests/month
- S3: 5GB storage
- DynamoDB: 25GB storage
- API Gateway: 1M requests/month

### Estimated Monthly Cost (after free tier)
- Lambda: ~$1-5/month
- S3: ~$0.50-2/month
- DynamoDB: ~$1-3/month
- API Gateway: ~$1-3/month
- **Total: ~$3-13/month**

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions
2. Configure custom domain with Route 53
3. Set up CloudFront for CDN
4. Implement monitoring and alerting
5. Set up backup and disaster recovery 