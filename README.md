# Wedding Website CDK Infrastructure

AWS CDK infrastructure for a modern wedding website with S3 static hosting, CloudFront CDN distribution, and deployment automation.

## 🏗️ Architecture Overview

This CDK project provisions a complete serverless infrastructure for hosting a wedding website:

- **S3 Bucket**: Static website hosting with versioning and lifecycle rules
- **CloudFront Distribution**: Global CDN with HTTPS, caching optimization, and SPA routing
- **Origin Access Control (OAC)**: Secure access between CloudFront and S3
- **Security Headers**: HSTS, CSP, X-Frame-Options via Response Headers Policy
- **Automated Deployment**: S3 bucket deployment with CloudFront cache invalidation
- **Custom Domain Support**: Route 53 DNS integration with automatic SSL certificates

## ✅ Completed Tasks

### Task 1: Initialize CDK Project ✅
- Created CDK TypeScript project structure
- Configured development environment
- Set up testing framework

### Task 2: Implement S3 Static Website Hosting ✅
**Files created/modified:**
- `lib/website-bucket.ts` - S3 bucket construct with:
  - Static website hosting configuration (index.html, error.html)
  - Public read access with secure bucket policy
  - Versioning enabled
  - CORS configuration
  - Lifecycle rules (Glacier transition after 30 days, deletion after 90 days)
  - CloudFormation outputs for bucket details

**Key features:**
- Environment-based removal policies (DESTROY for dev, RETAIN for prod)
- Automated deployment from build directory when context provided
- Cost optimization through lifecycle rules

### Task 3: Configure CloudFront Distribution ✅
**Files created/modified:**
- `lib/cloudfront-distribution.ts` - CloudFront distribution construct with:
  - Origin Access Control (OAC) for secure S3 access
  - HTTPS redirect (TLS 1.2 minimum)
  - SPA routing support (404/403 → index.html)
  - Multiple cache behaviors for different content types
  - Security headers policy
  - Access logging to dedicated S3 bucket

**Security implementations:**
- Response headers: HSTS, CSP, X-Frame-Options, Referrer-Policy
- TLS 1.2 minimum for viewer and origin connections
- CloudFront access logging with 90-day retention
- Optional geo-restrictions support

**Performance optimizations:**
- `/static/*` - 30-day cache for JS/CSS assets
- `/images/*` - 7-day cache for images  
- Default - Standard caching for HTML
- Compression enabled (gzip, brotli)
- IPv6 support

## 📁 Project Structure

```
wedding-website-cdk/
├── bin/
│   └── wedding-website-cdk.ts          # CDK app entry point
├── lib/
│   ├── wedding-website-cdk-stack.ts    # Main CDK stack
│   ├── website-bucket.ts               # S3 bucket construct
│   └── cloudfront-distribution.ts      # CloudFront construct
├── test/
│   └── wedding-website-cdk.test.ts     # Unit tests
├── build/                               # Sample React build directory
├── cdk.json                            # CDK configuration
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
└── jest.config.js                      # Jest test configuration
```

## 🚀 Deployment

### Prerequisites
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`
- AWS account bootstrapped: `cdk bootstrap`

### Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Synthesize CloudFormation template
npx cdk synth --context environment=dev

# Deploy to AWS
npx cdk deploy --context environment=dev
```

### Deployment with React Build

```bash
# Build your React app first
cd frontend  # (when React app is migrated)
npm run build
cd ..

# Deploy with build artifacts
npx cdk deploy --context environment=dev --context buildPath=./frontend/build
```

### Deployment with Custom Domain

```bash
# Deploy production with custom domain (configured in config/dns.json)
npx cdk deploy --context environment=production

# The stack will automatically:
# - Create/validate SSL certificate via ACM
# - Configure CloudFront with custom domain
# - Create Route 53 A/AAAA records
```

## 🔑 Key Features

### Environment Support
- **Development**: `RemovalPolicy.DESTROY` for easy cleanup
- **Production**: `RemovalPolicy.RETAIN` for data safety
- Context-based configuration via `--context environment=<env>`

### CloudFormation Outputs
After deployment, the stack provides:
- `WebsiteBucketName` - S3 bucket name
- `CloudFrontDistributionId` - Distribution ID for invalidations
- `CloudFrontDomainName` - CDN domain name
- `WebsiteURL` - Full HTTPS URL for the website (custom domain if configured)
- `CloudFrontLogsBucket` - Logs bucket name
- `CustomDomain` - Custom domain name (if DNS configured)

### Security Best Practices
- ✅ Origin Access Control (OAC) instead of deprecated OAI
- ✅ TLS 1.2 minimum for all connections
- ✅ Comprehensive security headers
- ✅ S3 bucket encryption at rest
- ✅ CloudFront access logging
- ✅ Public access blocked except through CloudFront

### Cost Optimization
- ✅ S3 lifecycle rules for old versions
- ✅ CloudFront caching strategies
- ✅ Automatic cleanup of incomplete multipart uploads
- ✅ Price class optimization (PRICE_CLASS_100)

### DNS & Custom Domain Support
- ✅ Route 53 DNS integration
- ✅ Automatic SSL/TLS certificate creation via ACM
- ✅ DNS validation for certificates
- ✅ IPv4 and IPv6 support (A and AAAA records)
- ✅ Environment-specific domain configuration
- ✅ Support for existing certificates

## 📝 Pending Tasks

### High Priority
- **Task 5**: Initialize React Application - Migrate existing React app
- **Task 6**: Implement Event Information Pages
- **Task 11**: Implement RSVP Form and Backend Integration

### Medium Priority
- **Task 4**: Setup CI/CD Pipeline
- **Task 7-10**: DynamoDB, Lambda, API Gateway, SES setup
- **Task 12**: Photo Gallery Component
- **Task 13**: Justfile for common commands

## 🧪 Testing

All constructs include comprehensive unit tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

Current test coverage: **100%** ✅
- S3 bucket configuration
- CloudFront distribution setup
- Security headers
- Lifecycle rules
- CORS configuration

## 🛠️ Useful Commands

* `npm run build` - Compile TypeScript to JavaScript
* `npm run watch` - Watch for changes and compile
* `npm run test` - Run Jest unit tests
* `npx cdk deploy` - Deploy stack to AWS
* `npx cdk diff` - Compare deployed vs local state
* `npx cdk synth` - Generate CloudFormation template
* `npx cdk destroy` - Remove stack from AWS

## 📊 Task Progress

- ✅ Task 1: Initialize CDK Project (100%)
- ✅ Task 2: S3 Static Website Hosting (100% - 5/5 subtasks)
- ✅ Task 3: CloudFront Distribution (100% - 5/5 subtasks)
- ⏳ Task 4: CI/CD Pipeline (0% - 0/6 subtasks)
- ⏳ Task 5: Initialize React Application (0% - 0/6 subtasks)
- ⏳ Task 6: Event Information Pages (0% - 0/7 subtasks)
- ⏳ Remaining backend tasks...

**Overall Progress**: 3/13 tasks complete (23%)

## 🔗 Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)

## 📄 License

MIT
