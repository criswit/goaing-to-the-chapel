# Deployment Instructions - CORS Fix

## ✅ Changes Ready for Deployment

All CORS issues have been fixed in the CDK code. The changes are:

1. **Lambda Environment Variables** - Added `CORS_ORIGIN` to all Lambda functions
2. **Updated CORS Headers** - API Gateway now includes `X-Auth-Token` and credentials support
3. **Lambda Response Headers** - Functions return proper CORS headers based on environment
4. **TypeScript Types** - Fixed to support all CORS headers

## 🚀 Deploy Now

Run this command to deploy the fixes:

```bash
npx cdk deploy RsvpBackendStack --require-approval never
```

This will:
- Update all Lambda functions with proper CORS configuration
- Update API Gateway with correct CORS headers
- Take about 5-10 minutes to complete

## 📋 Post-Deployment Steps

1. **Clear browser cache** or test in incognito mode
2. **Test the RSVP system** at https://wedding.himnher.dev
3. **If issues persist**, clear CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

## 🔍 Verify Deployment

After deployment, test CORS:

```bash
# Test OPTIONS request
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep "Access-Control"
```

You should see:
- `Access-Control-Allow-Origin: https://wedding.himnher.dev` or `*`
- `Access-Control-Allow-Methods: *`
- `Access-Control-Allow-Headers` including `X-Auth-Token`

## ⚠️ Known Issue with Custom Domain

If `api.wedding.himnher.dev` still returns 403 after deployment, this is a CloudFront/API Gateway custom domain issue. As a workaround:

1. Use the direct API Gateway URLs in `frontend/public/config.json`:
   ```json
   {
     "apiUrl": "https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/",
     "adminApiUrl": "https://t7w8s73kf3.execute-api.us-east-1.amazonaws.com/prod/",
     "environment": "production"
   }
   ```

2. Deploy the frontend with updated config

## 📁 Files Changed

- `lib/backend/rsvp-api.ts` - CORS configuration
- `lib/backend/lambda/utils.ts` - Dynamic CORS headers
- `lib/backend/lambda/types.ts` - TypeScript types
- `lib/rsvp-backend-stack.ts` - Allowed origins

## ✨ Expected Result

After deployment:
- No CORS errors in browser console
- RSVP functionality works from https://wedding.himnher.dev
- API returns proper CORS headers for all requests