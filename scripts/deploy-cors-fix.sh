#!/bin/bash

echo "Deploying CORS fixes for Wedding RSVP API..."
echo "============================================"

# Ensure we're in the right directory
cd /home/christopher/workplace/goaing-to-the-chapel

# Build the project
echo -e "\n1. Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed. Please fix errors and try again."
    exit 1
fi

# Build frontend
echo -e "\n2. Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "Frontend build failed."
    exit 1
fi
cd ..

# Deploy CDK stack
echo -e "\n3. Deploying CDK stack (this will take a few minutes)..."
npx cdk deploy RsvpBackendStack --require-approval never

if [ $? -eq 0 ]; then
    echo -e "\n✅ Deployment successful!"
    echo "============================================"
    echo "Next steps:"
    echo "1. Deploy the frontend build folder to S3/CloudFront"
    echo "2. Clear CloudFront cache if needed:"
    echo "   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"
    echo "3. Test the RSVP system at https://wedding.himnher.dev"
else
    echo -e "\n❌ Deployment failed. Check the error messages above."
    exit 1
fi