#!/bin/bash

# Script to rotate JWT keys and refresh Lambda functions
# Usage: ./scripts/rotate-jwt-keys.sh [environment]

ENVIRONMENT=${1:-production}
PROFILE="wedding-website"
REGION="us-east-1"

echo "🔄 JWT Key Rotation for environment: $ENVIRONMENT"
echo "================================================"
echo ""

# Step 1: Regenerate keys
echo "Step 1: Regenerating JWT keys..."
node scripts/init-jwt-keys.js $ENVIRONMENT --force

if [ $? -ne 0 ]; then
    echo "❌ Failed to regenerate keys"
    exit 1
fi

echo ""
echo "Step 2: Refreshing Lambda functions to use new keys..."
echo ""

# Get all Lambda function names that need refreshing
FUNCTIONS=$(aws lambda list-functions \
    --profile $PROFILE \
    --region $REGION \
    --query "Functions[?contains(FunctionName, 'AdminApi') || contains(FunctionName, 'admin')].FunctionName" \
    --output text)

if [ -z "$FUNCTIONS" ]; then
    echo "⚠️  No admin Lambda functions found to refresh"
else
    for FUNCTION in $FUNCTIONS; do
        echo "  Refreshing: $FUNCTION"
        aws lambda update-function-configuration \
            --function-name $FUNCTION \
            --environment "Variables={REFRESH_TIMESTAMP=$(date +%s)}" \
            --profile $PROFILE \
            --region $REGION \
            --output text --query 'LastModified' > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "    ✅ Refreshed successfully"
        else
            echo "    ⚠️  Failed to refresh (may not have environment variables)"
        fi
    done
fi

echo ""
echo "Step 3: Invalidating CloudFront cache (optional)..."
echo ""

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --profile $PROFILE \
    --query "DistributionList.Items[?contains(Comment, 'Wedding') || contains(Comment, 'wedding')].Id" \
    --output text | head -n1)

if [ -n "$DISTRIBUTION_ID" ]; then
    echo "  Found distribution: $DISTRIBUTION_ID"
    echo "  Creating invalidation..."
    
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/admin/*" \
        --profile $PROFILE \
        --output text --query 'Invalidation.Id' > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "  ✅ CloudFront cache invalidated"
    else
        echo "  ⚠️  Failed to invalidate cache"
    fi
else
    echo "  ⚠️  No CloudFront distribution found"
fi

echo ""
echo "================================================"
echo "✅ Key rotation complete!"
echo ""
echo "⚠️  IMPORTANT: All admin users must log in again"
echo "   Their existing sessions are now invalid."
echo ""