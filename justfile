# Wedding Website CDK - Build Commands
# Run `just --list` to see all available commands

# Default command - show help
default:
    @just --list

# CDK Commands
# Deploy stack without approval (use for CI/CD)
deploy:
    npx cdk deploy --require-approval never --profile wedding-website

# Deploy stack with manual approval
deploy-with-approval:
    npx cdk deploy --profile wedding-website

# Show CDK diff
diff:
    npx cdk diff --profile wedding-website

# Synthesize CDK app
synth:
    npx cdk synth --profile wedding-website

# Destroy CDK stack (with confirmation)
destroy:
    npx cdk destroy --profile wedding-website

# Bootstrap CDK environment
bootstrap:
    npx cdk bootstrap --profile wedding-website

# Build and Test Commands
# Build TypeScript
build:
    npm run build

# Run tests
test:
    npm test

# Run tests in watch mode
test-watch:
    npm test -- --watch

# Run linter
lint:
    npm run lint

# Utility Commands
# Clean and reinstall dependencies (CDK only, use clean-all for both)
clean:
    rm -rf node_modules dist cdk.out
    npm install

# View CloudWatch logs for a Lambda function
logs function-name:
    aws logs tail /aws/lambda/{{function-name}} --follow

# Environment-specific deployments
# Deploy to development environment
deploy-dev:
    npx cdk deploy -c environment=development --require-approval never --profile wedding-website

# Deploy to staging environment
deploy-staging:
    npx cdk deploy -c environment=staging --profile wedding-website

# Deploy to production environment (with approval) - THIS CREATES THE CERTIFICATE!
deploy-prod:
    npx cdk deploy -c environment=production --profile wedding-website

# Deploy to production without approval (for CI/CD)
deploy-prod-auto:
    npx cdk deploy -c environment=production --require-approval never --profile wedding-website

# Local Development
# Generate environment file from template
generate-env:
    ./generate-env.sh

# Setup Commands
# Install dependencies
install:
    npm install

# Full setup (install and build)
setup:
    npm install
    npm run build

# Validation Commands
# Validate CDK app
validate:
    npx cdk synth --quiet --profile wedding-website

# Check CDK version
cdk-version:
    npx cdk --version

# Check AWS credentials
check-aws:
    aws sts get-caller-identity --profile wedding-website

# Check certificate status (for wedding.himnher.dev)
check-cert:
    @echo "🔍 Checking ACM certificates for himnher.dev..."
    aws acm list-certificates --region us-east-1 --profile wedding-website --query "CertificateSummaryList[?contains(DomainName, 'himnher.dev')]" --output table

# Show production diff (what will be deployed to wedding.himnher.dev)
diff-prod:
    npx cdk diff -c environment=production --profile wedding-website

# Synthesize production stack (preview wedding.himnher.dev deployment)
synth-prod:
    npx cdk synth -c environment=production --profile wedding-website

# Frontend React Commands
# Start frontend development server
frontend-dev:
    export PATH="$PATH:/home/christopher/.local/share/mise/installs/node/22.18.0/bin/npm"
    cd frontend && npm start

# Sync frontend build to S3 bucket and invalidate CloudFront cache
frontend-sync:
    cd frontend && npm run build
    cd frontend && aws s3 sync ./build s3://wedding-website-986718858331-us-east-1 --delete --profile wedding-website
    @echo "✅ Frontend synced to S3 bucket"
    @echo "🔄 Creating CloudFront invalidation..."
    aws cloudfront create-invalidation --distribution-id E3N0RW2MNAQ4KG --paths "/*" --profile wedding-website --query "Invalidation.Id" --output text
    @echo "✅ CloudFront cache invalidated"

# Build frontend for production (creates optimized build in frontend/build/)
frontend-build:
    cd frontend && npm run build

# Run frontend tests
frontend-test:
    cd frontend && npm test

# Run frontend tests in watch mode
frontend-test-watch:
    cd frontend && npm test -- --watch

# Run frontend linter
frontend-lint:
    cd frontend && npm run lint

# Format frontend code
frontend-format:
    cd frontend && /home/christopher/.local/share/mise/installs/node/22.18.0/bin/npx prettier --write "src/**/*.{js,jsx,ts,tsx,json,css,md}"

# Install frontend dependencies
frontend-install:
    cd frontend && npm install

# Clean frontend build and dependencies
frontend-clean:
    cd frontend && rm -rf node_modules build
    cd frontend && npm install

# Combined Commands for Full Stack
# Build both CDK and frontend for production
build-all: build frontend-build
    @echo "✅ Built CDK and frontend successfully"

# Run all tests
test-all: test frontend-test
    @echo "✅ All tests completed"

# Run all linters (report issues but don't fail)
lint-all:
    -npm run lint
    -cd frontend && npm run lint
    @echo "✅ All linting completed"

# Format all code
format-all: frontend-format
    @echo "✅ All formatting completed"

# Install all dependencies (root and frontend)
install-all: install frontend-install
    @echo "✅ All dependencies installed"

# Clean everything and reinstall
clean-all:
    rm -rf node_modules dist cdk.out
    cd frontend && rm -rf node_modules build
    npm install
    cd frontend && npm install
    @echo "✅ Clean install completed"

# Development shortcuts
# Start frontend dev server (shortcut)
dev: frontend-dev

# Full deployment workflow
# Build everything and deploy to AWS
deploy-full: build-all
    npx cdk deploy --all --require-approval never --profile wedding-website
    @echo "✅ Full deployment completed"

# Deploy with manual approval
deploy-full-manual: build-all
    npx cdk deploy --profile wedding-website
    @echo "✅ Full deployment completed"

# Setup entire project from scratch
setup-full:
    npm install
    cd frontend && npm install
    just bootstrap
    @echo "✅ Project setup completed"

# Environment-specific setup commands
# Setup development environment
setup-dev:
    npm install
    cd frontend && npm install
    just bootstrap
    @echo "✅ Development environment setup completed"

# Setup production environment
setup-prod:
    just build-all
    just deploy-prod
    @echo "✅ Production environment setup completed"

# Guest Management Commands
# Add sample guests to the database (dry run - preview only)
add-guests-dry:
    npm run add-guests data/sample-guests.csv -- --dry-run

# Add sample guests to the database (actually imports them)
add-guests:
    npm run add-guests data/sample-guests.csv

# Add sample guests and generate invitation codes report
add-guests-report:
    npm run add-guests sample-guests.csv -- --generate-report
    @echo "✅ Guests added and invitation codes saved to invitation-codes.csv"

# Add custom guest list from CSV file
add-guests-custom csv-file:
    npm run add-guests {{csv-file}}

# Add custom guest list with dry run
add-guests-custom-dry csv-file:
    npm run add-guests {{csv-file}} -- --dry-run

# Create admin user
create-admin:
    npm run create-admin

# Quick admin setup (creates admin user with default credentials)
quick-admin:
    ./scripts/quick-admin-setup.sh

# Photo Gallery Management Commands
# Upload a single photo to the gallery
upload-photo photo-path category:
    node scripts/upload-photos.js "{{photo-path}}" {{category}}

# Upload a directory of photos to the gallery
upload-photos-dir directory category:
    node scripts/upload-photos.js "{{directory}}" {{category}} --dir

# Upload our story photos (shortcut)
upload-story-photos directory:
    node scripts/upload-photos.js "{{directory}}" our-story --dir

# Upload engagement photos (shortcut)
upload-engagement-photos directory:
    node scripts/upload-photos.js "{{directory}}" engagement --dir

# Upload venue photos (shortcut)
upload-venue-photos directory:
    node scripts/upload-photos.js "{{directory}}" venue --dir

# Upload celebration photos (shortcut)
upload-celebration-photos directory:
    node scripts/upload-photos.js "{{directory}}" celebration --dir

# Upload venue preview photos (shortcut)
upload-venue-preview-photos directory:
    node scripts/upload-photos.js "{{directory}}" venue-preview --dir

# Generate photo manifest after uploading photos
generate-photo-manifest:
    node scripts/generate-photo-manifest.js
    @echo "✅ Photo manifest generated successfully"

# Upload photos and refresh everything (directory upload with manifest and CDN refresh)
upload-and-refresh directory category:
    node scripts/upload-photos.js "{{directory}}" {{category}} --dir
    node scripts/generate-photo-manifest.js
    aws cloudfront create-invalidation --distribution-id E9PYPZ8LGGB9L --paths "/*" --profile wedding-website
    @echo "✅ Photos uploaded, manifest generated, and CDN cache cleared"

# Extract and upload photos from ZIP file
upload-zip zip-file category:
    #!/usr/bin/env bash
    set -e
    TEMP_DIR=$(mktemp -d)
    echo "📦 Extracting ZIP file to temporary directory..."
    unzip -q "{{zip-file}}" -d "$TEMP_DIR"
    echo "📤 Uploading photos from extracted files..."
    node scripts/upload-photos.js "$TEMP_DIR" {{category}} --dir
    echo "🧹 Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
    echo "📋 Generating photo manifest..."
    node scripts/generate-photo-manifest.js
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id E9PYPZ8LGGB9L --paths "/*" --profile wedding-website
    @echo "✅ ZIP photos uploaded, manifest generated, and CDN cache cleared"

# Quick upload for a single photo with full refresh
quick-photo-upload photo-path category:
    node scripts/upload-photos.js "{{photo-path}}" {{category}}
    node scripts/generate-photo-manifest.js
    aws cloudfront create-invalidation --distribution-id E9PYPZ8LGGB9L --paths "/*" --profile wedding-website
    @echo "✅ Photo uploaded, manifest generated, and CDN cache cleared"

# Show photo upload help
photo-upload-help:
    @echo "📸 Photo Upload Commands:"
    @echo ""
    @echo "Categories available:"
    @echo "  - our-story"
    @echo "  - engagement"
    @echo "  - venue"
    @echo "  - celebration"
    @echo "  - venue-preview"
    @echo ""
    @echo "Examples:"
    @echo "  just upload-photo ./my-photo.jpg our-story"
    @echo "  just upload-photos-dir ./engagement-photos/ engagement"
    @echo "  just upload-and-refresh ./venue-photos/ venue"
    @echo ""
    @echo "Shortcuts for common categories:"
    @echo "  just upload-story-photos ./our-story-photos/"
    @echo "  just upload-engagement-photos ./engagement-photos/"
    @echo ""

# Help Commands
# Show detailed help for a command
help command:
    @echo "Help for '{{command}}':"
    @just --show {{command}}

# List all available commands with descriptions
commands:
    @echo "Available commands:"
    @just --list --unsorted
