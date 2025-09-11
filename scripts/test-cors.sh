#!/bin/bash

echo "Testing CORS configuration for Wedding RSVP API..."
echo "================================================"

# Test the OPTIONS preflight request
echo -e "\n1. Testing OPTIONS preflight request to api.wedding.himnher.dev:"
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "< HTTP|< Access-Control"

echo -e "\n2. Testing direct API Gateway endpoint:"
# Get the actual API Gateway endpoint
API_ENDPOINT="https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/rsvp/validate"
echo "Testing: $API_ENDPOINT"
curl -X OPTIONS $API_ENDPOINT \
  -H "Origin: https://wedding.himnher.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "< HTTP|< Access-Control"

echo -e "\n3. Testing actual POST request with direct endpoint:"
curl -X POST $API_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "Origin: https://wedding.himnher.dev" \
  -d '{"invitationCode":"TEST123"}' \
  -v 2>&1 | grep -E "< HTTP|< Access-Control"

echo -e "\n================================================"
echo "If you see 403 errors above, the issue is with API Gateway CORS configuration."
echo "If you see proper Access-Control headers, the issue might be with the custom domain mapping."