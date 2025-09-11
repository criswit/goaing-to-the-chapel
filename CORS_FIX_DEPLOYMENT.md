# CORS Fix Deployment Instructions

## Changes Made

### CDK Infrastructure Changes

1. **API Domain Configuration** (`lib/backend/api-domain-config.ts`):
   - Kept `REGIONAL` endpoint type (cannot change from REGIONAL to EDGE in one update)
   - Changed base path mapping to include `production` stage path
   - Certificate configuration for the custom domain

2. **RSVP API Configuration** (`lib/backend/rsvp-api.ts`):
   - Added tracing and method options to deployment configuration
   - Added `maxAge` to CORS preflight options for caching
   - **Added Gateway Responses for 4XX and 5XX errors with CORS headers**
   - Lambda functions have `CORS_ORIGIN` environment variable

### Frontend Changes

1. **RSVP API Service** (`frontend/src/services/rsvpApi.ts`):
   - Updated to use `https://api.wedding.himnher.dev/production` instead of direct API Gateway URL

2. **Config File** (`frontend/public/config.json`):
   - Updated `apiUrl` to use custom domain: `https://api.wedding.himnher.dev/production/`

## Deployment Steps

### 1. Deploy CDK Changes

```bash
# Deploy the backend infrastructure changes
npx cdk deploy RsvpBackendStack --require-approval never
```

**Note**: This deployment will:
- Update the API Gateway custom domain to use EDGE endpoint type
- Create/update CloudFront distribution for the custom domain
- May take 15-40 minutes for CloudFront distribution to fully propagate

### 2. Build and Deploy Frontend

```bash
# Build the frontend with updated configuration
cd frontend
npm run build

# Deploy to S3 (if using S3/CloudFront hosting)
aws s3 sync build/ s3://your-wedding-website-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## What This Fixes

The Gateway Response configuration ensures:
- CORS headers are returned even for 4XX errors (including 403 Forbidden)
- OPTIONS requests that hit errors still return proper CORS headers
- Custom domain properly handles preflight requests
- Base path mapping correctly routes to the production stage

## Verification

After deployment, test CORS:

```bash
# Test OPTIONS request
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Should return:
# HTTP/2 200 or 204
# Access-Control-Allow-Origin: https://wedding.himnher.dev
# Access-Control-Allow-Methods: *
# Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Auth-Token
# Access-Control-Allow-Credentials: true
```

## Important Notes

1. **Certificate Creation**: The first deployment may take longer as it needs to create and validate the SSL certificate
2. **DNS Propagation**: After deployment, it may take a few minutes for DNS changes to propagate
3. **Gateway Responses**: The new Gateway Response configuration ensures CORS headers are returned even when API Gateway returns error responses

## Rollback Plan

If issues persist:
1. Revert to REGIONAL endpoint type in `lib/backend/api-domain-config.ts`
2. Use direct API Gateway URLs in frontend as temporary workaround
3. Redeploy CDK and frontend

## Success Criteria

- ✅ No CORS errors in browser console
- ✅ RSVP form submissions work from https://wedding.himnher.dev
- ✅ API returns proper CORS headers for all requests
- ✅ OPTIONS requests return 200/204 status code