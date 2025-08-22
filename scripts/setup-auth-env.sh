#!/bin/bash

echo "🚀 Setting up Authentication Environment Variables for F1 Race Simulator"
echo "=================================================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file already exists"
    echo "📝 Current environment variables:"
    echo "----------------------------------------"
    grep -E "^(NEXTAUTH_|GOOGLE_|AWS_|METADATA_TABLE)" .env.local || echo "No auth variables found"
    echo "----------------------------------------"
else
    echo "📝 Creating .env.local file..."
    touch .env.local
fi

echo ""
echo "🔧 Required Environment Variables:"
echo "=================================="
echo "1. NEXTAUTH_SECRET - Generate with: openssl rand -base64 32"
echo "2. NEXTAUTH_URL - http://localhost:3000 (for local dev)"
echo "3. GOOGLE_CLIENT_ID - From Google Cloud Console"
echo "4. GOOGLE_CLIENT_SECRET - From Google Cloud Console"
echo "5. AWS_REGION - Your AWS region (e.g., us-east-1)"
echo "6. AWS_ACCESS_KEY_ID - Your AWS access key"
echo "7. AWS_SECRET_ACCESS_KEY - Your AWS secret key"
echo "8. METADATA_TABLE - Your existing table name (e.g., f1-strategy-metadata-dev)"
echo ""

echo "💡 Quick Setup Commands:"
echo "========================"
echo "# Generate NextAuth secret:"
echo "openssl rand -base64 32"
echo ""
echo "# Add to .env.local:"
echo "echo 'NEXTAUTH_SECRET=your-generated-secret' >> .env.local"
echo "echo 'NEXTAUTH_URL=http://localhost:3000' >> .env.local"
echo "echo 'GOOGLE_CLIENT_ID=your-google-client-id' >> .env.local"
echo "echo 'GOOGLE_CLIENT_SECRET=your-google-client-secret' >> .env.local"
echo "echo 'AWS_REGION=us-east-1' >> .env.local"
echo "echo 'AWS_ACCESS_KEY_ID=your-aws-access-key' >> .env.local"
echo "echo 'AWS_SECRET_ACCESS_KEY=your-aws-secret-key' >> .env.local"
echo "echo 'METADATA_TABLE=f1-strategy-metadata-dev' >> .env.local"
echo ""

echo "🔍 Next Steps:"
echo "=============="
echo "1. Set up Google OAuth in Google Cloud Console"
echo "2. Add redirect URIs: http://localhost:3000/api/auth/callback/google"
echo "3. For production: https://yourdomain.com/api/auth/callback/google"
echo "4. Add environment variables to .env.local"
echo "5. Restart your development server"
echo ""

echo "✅ Setup complete! Check the documentation for detailed OAuth setup steps."
echo ""
echo "ℹ️  Note: Your DynamoDB infrastructure is already set up via AWS SAM."
echo "   This script only configures the environment variables needed for authentication."
