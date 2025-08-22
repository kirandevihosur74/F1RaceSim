#!/bin/bash

# Script to move f1-simulation-results table from us-east-1 to us-west-1

SOURCE_REGION="us-east-1"
TARGET_REGION="us-west-1"
TABLE_NAME="f1-simulation-results"

echo "🚀 Starting table migration from $SOURCE_REGION to $TARGET_REGION..."

# Check if table exists in source region
echo "📋 Checking if table exists in $SOURCE_REGION..."
if ! aws dynamodb describe-table --table-name $TABLE_NAME --region $SOURCE_REGION > /dev/null 2>&1; then
    echo "❌ Table $TABLE_NAME not found in $SOURCE_REGION"
    exit 1
fi

# Get table description from source
echo "📊 Getting table description from $SOURCE_REGION..."
TABLE_DESCRIPTION=$(aws dynamodb describe-table --table-name $TABLE_NAME --region $SOURCE_REGION)

# Extract table properties
echo "🔧 Extracting table properties..."
ATTRIBUTE_DEFINITIONS=$(echo $TABLE_DESCRIPTION | jq -r '.Table.AttributeDefinitions | tojson')
KEY_SCHEMA=$(echo $TABLE_DESCRIPTION | jq -r '.Table.KeySchema | tojson')

# Check billing mode - handle both BillingMode and BillingModeSummary
BILLING_MODE=$(echo $TABLE_DESCRIPTION | jq -r '.Table.BillingMode // .Table.BillingModeSummary.BillingMode // "PAY_PER_REQUEST"')
echo "💰 Billing mode: $BILLING_MODE"

# Create table in target region
echo "🏗️ Creating table in $TARGET_REGION..."
aws dynamodb create-table \
    --table-name $TABLE_NAME \
    --attribute-definitions "$ATTRIBUTE_DEFINITIONS" \
    --key-schema "$KEY_SCHEMA" \
    --billing-mode $BILLING_MODE \
    --region $TARGET_REGION

# Wait for table to be active
echo "⏳ Waiting for table to become active in $TARGET_REGION..."
aws dynamodb wait table-exists --table-name $TABLE_NAME --region $TARGET_REGION

# Export data from source region
echo "📤 Exporting data from $SOURCE_REGION..."
aws dynamodb scan --table-name $TABLE_NAME --region $SOURCE_REGION > /tmp/table_data.json

# Import data to target region
echo "📥 Importing data to $TARGET_REGION..."
jq -c '.Items[]' /tmp/table_data.json | while read -r item; do
    aws dynamodb put-item \
        --table-name $TABLE_NAME \
        --item "$item" \
        --region $TARGET_REGION
done

# Verify data migration
echo "✅ Verifying data migration..."
SOURCE_COUNT=$(aws dynamodb scan --table-name $TABLE_NAME --region $SOURCE_REGION --select COUNT | jq -r '.Count')
TARGET_COUNT=$(aws dynamodb scan --table-name $TABLE_NAME --region $TARGET_REGION --select COUNT | jq -r '.Count')

echo "📊 Source region ($SOURCE_REGION) item count: $SOURCE_COUNT"
echo "📊 Target region ($TARGET_REGION) item count: $TARGET_COUNT"

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
    echo "✅ Data migration successful! All $SOURCE_COUNT items migrated."
    
    # Optionally delete the source table
    read -p "🗑️ Do you want to delete the table from $SOURCE_REGION? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️ Deleting table from $SOURCE_REGION..."
        aws dynamodb delete-table --table-name $TABLE_NAME --region $SOURCE_REGION
        echo "✅ Table deleted from $SOURCE_REGION"
    fi
else
    echo "❌ Data migration failed. Counts don't match."
    exit 1
fi

# Clean up temporary files
rm -f /tmp/table_data.json

echo "🎉 Table migration completed successfully!"
echo "📍 All tables are now in $TARGET_REGION"
