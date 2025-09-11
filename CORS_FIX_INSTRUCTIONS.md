# CORS Fix Instructions for Wedding RSVP System

## Problem
The frontend at `https://wedding.himnher.dev` is getting CORS errors when trying to call the API at `https://api.wedding.himnher.dev`.

## Solution Steps

### 1. Deploy CDK Changes
The CDK stack has been updated to include proper CORS origins. Deploy the changes:

```bash
cd /home/christopher/workplace/goaing-to-the-chapel
npm run build
npx cdk deploy RsvpBackendStack --require-approval never
```

### 2. Update Lambda Environment Variables (Optional)
If the CDK deployment doesn't update the environment variables, run:

```bash
./scripts/update-cors.sh
```

### 3. Verify API Gateway CORS Configuration
Check that the API Gateway has proper CORS headers:

```bash
# Test OPTIONS preflight request
curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
  -H "Origin: https://wedding.himnher.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

You should see:
- `Access-Control-Allow-Origin: https://wedding.himnher.dev` or `*`
- `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Auth-Token`

### 4. Update Frontend Configuration
The frontend config has been updated to use the custom domain:

```json
{
  "apiUrl": "https://api.wedding.himnher.dev/production/",
  "adminApiUrl": "https://api.wedding.himnher.dev/production/admin/",
  "environment": "production"
}
```

Deploy the frontend:

```bash
cd frontend
npm run build
# Deploy build folder to S3/CloudFront
```

## What Changed

### 1. CDK Stack (`lib/rsvp-backend-stack.ts`)
- Added explicit CORS origins for `https://wedding.himnher.dev` and `https://www.wedding.himnher.dev`

### 2. Lambda Utils (`lib/backend/lambda/utils.ts`)
- Updated `createResponse` function to use `CORS_ORIGIN` environment variable
- Added `Access-Control-Allow-Credentials: true` header
- Added `X-Auth-Token` to allowed headers

### 3. Frontend Config (`frontend/public/config.json`)
- Updated to use custom API domain instead of direct API Gateway URLs

## Testing

1. Open browser developer console
2. Go to https://wedding.himnher.dev
3. Try the RSVP functionality
4. Check that no CORS errors appear in the console

## Alternative Quick Fix (Not Recommended for Production)

If you need a quick fix while waiting for deployment, you can temporarily set Lambda functions to allow all origins:

```bash
# For each Lambda function
aws lambda update-function-configuration \
  --function-name wedding-validate-invitation-production \
  --environment "Variables={CORS_ORIGIN='*'}" \
  --region us-east-1
```

But this is not secure for production use.

## Troubleshooting

If CORS errors persist:

1. Check CloudFront is not caching old responses:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

2. Verify the API domain is correctly mapped:
```bash
nslookup api.wedding.himnher.dev
```

3. Check API Gateway logs in CloudWatch for any 403 errors

4. Ensure the browser is not caching old preflight responses (try incognito mode)