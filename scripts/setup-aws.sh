#!/bin/bash

# F1 Race Simulator - AWS Setup Script
# This script helps set up the initial AWS resources for the project

set -e

echo "🏎️  F1 Race Simulator - AWS Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first:"
        echo "  macOS: brew install awscli"
        echo "  Linux: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Check if AWS credentials are configured
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured. Please run 'aws configure' first."
        exit 1
    fi
    print_success "AWS credentials are configured"
}

# Generate unique bucket names
generate_bucket_names() {
    TIMESTAMP=$(date +%s)
    RANDOM_SUFFIX=$(openssl rand -hex 4)
    DATA_BUCKET="f1-race-sim-data-${TIMESTAMP}-${RANDOM_SUFFIX}"
    ASSETS_BUCKET="f1-race-sim-assets-${TIMESTAMP}-${RANDOM_SUFFIX}"
    
    print_status "Generated bucket names:"
    echo "  Data bucket: ${DATA_BUCKET}"
    echo "  Assets bucket: ${ASSETS_BUCKET}"
}

# Create S3 buckets
create_s3_buckets() {
    print_status "Creating S3 buckets..."
    
    # Create data bucket
    aws s3 mb "s3://${DATA_BUCKET}" --region us-east-1
    aws s3api put-bucket-versioning --bucket "${DATA_BUCKET}" --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket "${DATA_BUCKET}" --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    print_success "Created data bucket: ${DATA_BUCKET}"
    
    # Create assets bucket
    aws s3 mb "s3://${ASSETS_BUCKET}" --region us-east-1
    aws s3api put-bucket-versioning --bucket "${ASSETS_BUCKET}" --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket "${ASSETS_BUCKET}" --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    print_success "Created assets bucket: ${ASSETS_BUCKET}"
}

# Create DynamoDB table
create_dynamodb_table() {
    print_status "Creating DynamoDB table..."
    
    TABLE_NAME="f1-simulation-results"
    
    aws dynamodb create-table \
        --table-name "${TABLE_NAME}" \
        --attribute-definitions AttributeName=simulation_id,AttributeType=S \
        --key-schema AttributeName=simulation_id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region us-east-1
    
    # Wait for table to be active
    print_status "Waiting for DynamoDB table to be active..."
    aws dynamodb wait table-exists --table-name "${TABLE_NAME}" --region us-east-1
    
    print_success "Created DynamoDB table: ${TABLE_NAME}"
}

# Create IAM policy
create_iam_policy() {
    print_status "Creating IAM policy..."
    
    POLICY_NAME="F1RaceSimPolicy"
    POLICY_ARN=""
    
    # Check if policy already exists
    if aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}" &> /dev/null; then
        print_warning "IAM policy ${POLICY_NAME} already exists"
        POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}"
    else
        # Create policy document
        cat > /tmp/f1-race-sim-policy.json << EOF
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
                "arn:aws:s3:::${DATA_BUCKET}",
                "arn:aws:s3:::${DATA_BUCKET}/*",
                "arn:aws:s3:::${ASSETS_BUCKET}",
                "arn:aws:s3:::${ASSETS_BUCKET}/*"
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
            "Resource": "arn:aws:dynamodb:us-east-1:*:table/f1-simulation-results"
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:*:*"
        }
    ]
}
EOF
        
        # Create the policy
        POLICY_ARN=$(aws iam create-policy \
            --policy-name "${POLICY_NAME}" \
            --policy-document file:///tmp/f1-race-sim-policy.json \
            --query 'Policy.Arn' \
            --output text)
        
        print_success "Created IAM policy: ${POLICY_ARN}"
    fi
}

# Generate environment file
generate_env_file() {
    print_status "Generating environment file..."
    
    cat > backend/.env << EOF
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)

# S3 Buckets
S3_DATA_BUCKET=${DATA_BUCKET}
S3_ASSETS_BUCKET=${ASSETS_BUCKET}

# DynamoDB
DYNAMODB_TABLE=f1-simulation-results

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o

# API Configuration
API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
CORS_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# Logging
LOG_LEVEL=INFO
ENVIRONMENT=development

# Security
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
    
    print_success "Generated backend/.env file"
    print_warning "Please update OPENAI_API_KEY in backend/.env with your actual OpenAI API key"
}

# Main execution
main() {
    print_status "Starting AWS setup..."
    
    # Pre-flight checks
    check_aws_cli
    check_aws_credentials
    
    # Generate resources
    generate_bucket_names
    create_s3_buckets
    create_dynamodb_table
    create_iam_policy
    generate_env_file
    
    print_success "AWS setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your OpenAI API key"
    echo "2. Install AWS SAM CLI: brew install aws-sam-cli"
    echo "3. Deploy the application: sam build && sam deploy --guided"
    echo "4. Update the API URL in your frontend environment"
    echo ""
    echo "Resources created:"
    echo "- S3 Data Bucket: ${DATA_BUCKET}"
    echo "- S3 Assets Bucket: ${ASSETS_BUCKET}"
    echo "- DynamoDB Table: f1-simulation-results"
    echo "- IAM Policy: F1RaceSimPolicy"
}

# Run main function
main "$@" 