# CORS CDK Fixes - Complete Solution

## Problem Summary
The wedding RSVP website at `https://wedding.himnher.dev` was getting CORS errors when calling the API. The issue was that:
1. The CDK stack wasn't properly configuring CORS for individual endpoints
2. Lambda functions needed CORS_ORIGIN environment variable
3. The custom domain might be blocking OPTIONS requests

## CDK Changes Made

### 1. Updated Lambda Environment Variables (`lib/backend/rsvp-api.ts`)
Added `CORS_ORIGIN` to Lambda environment:
```typescript
const lambdaEnvironment = {
  TABLE_NAME: props.table.tableName,
  REGION: cdk.Stack.of(this).region,
  STAGE: environment,
  LOG_LEVEL: 'INFO',
  CORS_ORIGIN: props.allowedOrigins && props.allowedOrigins.length === 1 
    ? props.allowedOrigins[0] 
    : '*',
};
```

### 2. Added Explicit CORS Preflight (`lib/backend/rsvp-api.ts`)
Added explicit CORS configuration for critical endpoints:
```typescript
// For /rsvp/validate endpoint
validateResource.addCorsPreflight({
  allowOrigins: props.allowedOrigins || ['*'],
  allowMethods: ['POST', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Auth-Token',
  ],
  allowCredentials: true,
});
```

### 3. Updated Lambda Response Headers (`lib/backend/lambda/utils.ts`)
Modified `createResponse` to use environment-based CORS:
```typescript
export const createResponse = (statusCode: number, body: any): APIResponse => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Auth-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  };
};
```

### 4. Updated TypeScript Types (`lib/backend/lambda/types.ts`)
Added optional `Access-Control-Allow-Credentials` to APIResponse:
```typescript
export interface APIResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Credentials'?: string;
  };
  body: string;
}
```

### 5. Updated Allowed Origins (`lib/rsvp-backend-stack.ts`)
Ensured production domains are in allowed origins:
```typescript
allowedOrigins = [
  `https://${props.domainName}`,
  `https://www.${props.domainName}`,
  'https://wedding.himnher.dev',
  'https://www.wedding.himnher.dev',
  'https://api.wedding.himnher.dev',
  'http://localhost:3000',
  'http://localhost:5173',
];
```

## Deployment Instructions

### Quick Deploy
Run the deployment script:
```bash
./scripts/deploy-cors-fix.sh
```

### Manual Deploy
1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy CDK stack:
   ```bash
   npx cdk deploy RsvpBackendStack --require-approval never
   ```

3. Build and deploy frontend:
   ```bash
   cd frontend
   npm run build
   # Deploy build folder to S3/CloudFront
   ```

## Testing

### Test CORS Configuration
Use the test script:
```bash
./scripts/test-cors.sh
```

### Manual Testing
1. Test OPTIONS request:
   ```bash
   curl -X OPTIONS https://api.wedding.himnher.dev/production/rsvp/validate \
     -H "Origin: https://wedding.himnher.dev" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

2. Test actual API call:
   ```bash
   curl -X POST https://api.wedding.himnher.dev/production/rsvp/validate \
     -H "Content-Type: application/json" \
     -H "Origin: https://wedding.himnher.dev" \
     -d '{"invitationCode":"TEST123"}' \
     -v
   ```

## Troubleshooting

### If CORS errors persist after deployment:

1. **Clear CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

2. **Check API Gateway deployment:**
   - Go to AWS Console > API Gateway
   - Select your API
   - Click "Deploy API"
   - Select "production" stage

3. **Verify Lambda environment variables:**
   ```bash
   aws lambda get-function-configuration \
     --function-name wedding-validate-invitation-production \
     --query 'Environment.Variables.CORS_ORIGIN'
   ```

4. **Check custom domain mapping:**
   - Ensure `api.wedding.himnher.dev` points to the correct API Gateway
   - Check Route53 records
   - Verify certificate is valid

## Custom Domain Issue

If the custom domain continues to return 403 for OPTIONS:
1. The issue might be with the API Gateway custom domain configuration
2. As a workaround, you can use the direct API Gateway URL in `frontend/public/config.json`
3. The direct URLs that work are:
   - API: `https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production/`
   - Admin: `https://t7w8s73kf3.execute-api.us-east-1.amazonaws.com/prod/`

## Files Modified
- `lib/backend/rsvp-api.ts` - Added CORS configuration
- `lib/backend/lambda/utils.ts` - Updated response headers
- `lib/backend/lambda/types.ts` - Updated TypeScript types
- `lib/rsvp-backend-stack.ts` - Updated allowed origins
- `frontend/public/config.json` - API endpoints configuration

## Success Criteria
- No CORS errors in browser console
- OPTIONS requests return 200/204 status
- Response headers include proper `Access-Control-Allow-*` headers
- RSVP functionality works from https://wedding.himnher.dev