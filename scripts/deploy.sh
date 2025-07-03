#!/bin/bash

# F1 Race Simulator Deployment Script
# This script automates the deployment of both frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}
STACK_NAME="f1-race-simulator-${ENVIRONMENT}"

echo -e "${BLUE}🏎️  F1 Race Simulator Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"
echo -e "${BLUE}Stack Name: ${STACK_NAME}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check SAM CLI
    if ! command -v sam &> /dev/null; then
        print_error "AWS SAM CLI is not installed"
        exit 1
    fi
    
    print_status "All prerequisites are satisfied"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    # Install dependencies
    npm install
    
    # Build for production
    npm run build
    
    print_status "Frontend build completed"
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend to AWS..."
    
    cd infra
    
    # Build SAM application
    print_status "Building SAM application..."
    sam build
    
    # Deploy to AWS
    print_status "Deploying to AWS..."
    sam deploy \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides Environment=${ENVIRONMENT} \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset
    
    # Get API URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name ${STACK_NAME} \
        --region ${REGION} \
        --query 'Stacks[0].Outputs[?OutputKey==`F1RaceSimulatorApi`].OutputValue' \
        --output text)
    
    print_status "Backend deployed successfully"
    print_status "API URL: ${API_URL}"
    
    cd ..
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found, installing..."
        npm install -g vercel
    fi
    
    # Deploy to Vercel
    vercel --prod --yes
    
    print_status "Frontend deployed successfully"
}

# Set up environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Create .env.local for frontend
    cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_ENVIRONMENT=${ENVIRONMENT}
EOF
    
    print_status "Environment variables configured"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Frontend tests
    npm run test || print_warning "Frontend tests failed"
    
    # Backend tests (if available)
    cd backend
    python -m pytest tests/ || print_warning "Backend tests failed"
    cd ..
    
    print_status "Tests completed"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Build frontend
    build_frontend
    
    # Deploy backend
    deploy_backend
    
    # Set up environment
    setup_environment
    
    # Deploy frontend
    deploy_frontend
    
    # Run tests
    run_tests
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}Frontend: https://your-app.vercel.app${NC}"
    echo -e "${BLUE}Backend API: ${API_URL}${NC}"
    echo -e "${BLUE}API Documentation: ${API_URL}/docs${NC}"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backend")
        check_prerequisites
        deploy_backend
        ;;
    "frontend")
        check_prerequisites
        build_frontend
        deploy_frontend
        ;;
    "test")
        run_tests
        ;;
    "clean")
        print_status "Cleaning up..."
        rm -rf .next
        rm -rf node_modules
        rm -rf backend/__pycache__
        rm -rf infra/.aws-sam
        print_status "Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {deploy|backend|frontend|test|clean} [environment] [region]"
        echo "  deploy    - Deploy both frontend and backend (default)"
        echo "  backend   - Deploy only backend"
        echo "  frontend  - Deploy only frontend"
        echo "  test      - Run tests"
        echo "  clean     - Clean up build artifacts"
        exit 1
        ;;
esac 