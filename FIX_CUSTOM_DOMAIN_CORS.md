# Fix Custom Domain CORS Issue

## Problem
The custom domain `api.wedding.himnher.dev` returns 403 for OPTIONS requests, blocking CORS preflight checks. This is happening at the CloudFront/custom domain level, not at the API Gateway level.

## Immediate Workaround (Use Direct API URLs)

### 1. Update Frontend Config
Edit `frontend/public/config.json`:

```json
{
  "apiUrl": "https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/",
  "adminApiUrl": "https://t7w8s73kf3.execute-api.us-east-1.amazonaws.com/prod/",
  "environment": "production"
}
```

### 2. Deploy Frontend
```bash
cd frontend
npm run build
# Deploy build folder to S3/CloudFront
aws s3 sync build/ s3://your-frontend-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

This will make the RSVP system work immediately.

## Permanent Fix (Fix Custom Domain)

### Option 1: Remove and Recreate Custom Domain

1. **Remove the custom domain mapping:**
```bash
# In AWS Console:
# API Gateway > Custom Domains > api.wedding.himnher.dev > Delete
```

2. **Update CDK to recreate it:**
```bash
npx cdk deploy RsvpBackendStack --require-approval never
```

### Option 2: Check CloudFront Distribution Settings

The custom domain might have a CloudFront distribution that's blocking OPTIONS. Check:

1. **Find the CloudFront distribution:**
```bash
aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items[?contains(@, 'api.wedding.himnher.dev')]].[Id,DomainName]" --output table
```

2. **Update CloudFront behavior for OPTIONS:**
```bash
# Get distribution config
aws cloudfront get-distribution-config --id YOUR_DISTRIBUTION_ID > dist-config.json

# Edit dist-config.json to allow OPTIONS method in CacheBehaviors
# Look for "AllowedMethods" and ensure it includes "OPTIONS"

# Update distribution
aws cloudfront update-distribution --id YOUR_DISTRIBUTION_ID --cli-input-json file://dist-config.json
```

### Option 3: Use Route53 to Point Directly to API Gateway

1. **Get API Gateway domain:**
```bash
aws apigateway get-domain-names --query "items[?domainName=='api.wedding.himnher.dev']"
```

2. **Update Route53 record:**
```bash
aws route53 list-hosted-zones  # Find your zone ID

# Update A record to point directly to API Gateway
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.wedding.himnher.dev",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z1UJRXOUMOOFQ8",  # API Gateway hosted zone for us-east-1
        "DNSName": "YOUR_API_GATEWAY_DOMAIN.execute-api.us-east-1.amazonaws.com",
        "EvaluateTargetHealth": false
      }
    }
  }]
}'
```

## Testing

### Verify which service is blocking:
```bash
# Test direct API Gateway (should work)
curl -X OPTIONS https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -v 2>&1 | grep "< HTTP"
# Expected: HTTP/2 204

# Test custom domain (currently failing)
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -v 2>&1 | grep "< HTTP"
# Currently: HTTP/2 403
```

## Root Cause

The issue is that:
1. API Gateway is configured correctly (direct URL works)
2. Custom domain has additional layer (likely CloudFront) that blocks OPTIONS
3. This layer doesn't forward OPTIONS requests to API Gateway

## Recommended Action

**For immediate fix:** Use the direct API Gateway URLs (Option 1 above)

**For permanent fix:** 
1. Check if there's a CloudFront distribution for api.wedding.himnher.dev
2. If yes, update its behavior to allow OPTIONS
3. If no, check API Gateway custom domain configuration

## CDK Fix (Already Applied)

The CDK code is correct with:
- Proper CORS headers in API Gateway
- Lambda functions returning correct headers
- Allowed origins configured

The issue is purely with the custom domain layer, not the API itself.