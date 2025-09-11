#!/bin/bash

# Test script for guest import API endpoint using curl
# Usage: ./test-guest-import.sh

# Configuration - Update this with your actual API endpoint
API_ENDPOINT="${API_ENDPOINT:-https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/production}"
EVENT_ID="wedding-2025-06-14"

# Check if API endpoint is configured
if [[ "$API_ENDPOINT" == *"your-api-gateway-url"* ]]; then
  echo "⚠️  Please set the API_ENDPOINT environment variable"
  echo "Example: API_ENDPOINT=https://xyz123.execute-api.us-east-1.amazonaws.com/production ./test-guest-import.sh"
  exit 1
fi

echo "🚀 Testing guest import endpoint..."
echo "📍 URL: ${API_ENDPOINT}/guests/import"
echo ""

# Make the API request
curl -X POST "${API_ENDPOINT}/guests/import" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "'"${EVENT_ID}"'",
    "guests": [
      {
        "name": "Test Guest One",
        "email": "test1@example.com",
        "phone": "+1234567890",
        "plusOnesAllowed": 2,
        "groupName": "Test Group",
        "groupId": "test-group-1",
        "isPrimaryContact": true
      },
      {
        "name": "Test Guest Two",
        "email": "test2@example.com",
        "plusOnesAllowed": 1,
        "groupName": "Test Group",
        "groupId": "test-group-1",
        "isPrimaryContact": false
      }
    ]
  }' \
  -w "\n\n📊 Response Status: %{http_code}\n⏱️  Total Time: %{time_total}s\n" \
  -s | jq '.'

echo ""
echo "✅ Test complete!"