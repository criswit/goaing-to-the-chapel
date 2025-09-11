#!/bin/bash

# Script to update CORS configuration for Lambda functions
echo "Updating Lambda environment variables for CORS..."

# List of Lambda functions that need CORS_ORIGIN update
LAMBDA_FUNCTIONS=(
  "wedding-validate-invitation-production"
  "wedding-generate-token-production"
  "wedding-get-rsvp-production"
  "wedding-create-rsvp-production"
  "wedding-get-rsvp-status-production"
  "wedding-list-rsvps-production"
  "wedding-update-rsvp-production"
  "wedding-batch-party-production"
  "wedding-create-guest-production"
)

# Update each Lambda function
for FUNCTION_NAME in "${LAMBDA_FUNCTIONS[@]}"; do
  echo "Updating $FUNCTION_NAME..."
  
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --environment "Variables={CORS_ORIGIN='https://wedding.himnher.dev',$(aws lambda get-function-configuration --function-name $FUNCTION_NAME --query 'Environment.Variables' --output text | tr '\t' ',' | sed 's/CORS_ORIGIN,[^,]*,//')}" \
    --region us-east-1 \
    --no-cli-pager 2>/dev/null || echo "Function $FUNCTION_NAME not found or update failed"
done

echo "CORS configuration update complete!"