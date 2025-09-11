# CORS Fix Deployment Instructions

## Changes Made

### CDK Infrastructure Changes

1. **API Domain Configuration** (`lib/backend/api-domain-config.ts`):
   - Changed endpoint type from `REGIONAL` to `EDGE` for better CORS handling
   - Updated certificate to use `DnsValidatedCertificate` with `us-east-1` region (required for EDGE endpoints)
   - Changed base path mapping to include `production` stage path

2. **RSVP API Configuration** (`lib/backend/rsvp-api.ts`):
   - Added tracing and method options to deployment configuration
   - CORS headers already properly configured with `allowCredentials: true`
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

The EDGE endpoint type for API Gateway custom domains:
- Uses CloudFront for the custom domain, which properly handles CORS preflight requests
- Ensures OPTIONS requests are correctly forwarded to API Gateway
- Provides better global distribution and caching capabilities

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

1. **Certificate Creation**: The first deployment may take longer as it needs to create and validate the SSL certificate in us-east-1
2. **DNS Propagation**: After deployment, it may take a few minutes for DNS changes to propagate
3. **CloudFront Distribution**: The EDGE endpoint creates a CloudFront distribution which can take 15-40 minutes to fully deploy

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