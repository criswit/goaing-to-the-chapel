# GitHub Actions CI/CD Pipeline

This workflow automatically builds and deploys the wedding website React application to AWS S3 and CloudFront when changes are pushed to the main branch.

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings (Settings > Secrets and variables > Actions):

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: AWS access key with permissions for S3 and CloudFront operations
- `AWS_SECRET_ACCESS_KEY`: Corresponding AWS secret key

### Deployment Configuration
- `BUCKET_NAME`: The name of your S3 bucket (e.g., `wedding-website-frontend`)
- `DISTRIBUTION_ID`: Your CloudFront distribution ID

### Optional Notifications
- `SLACK_WEBHOOK`: Slack webhook URL for deployment notifications (optional)

## GitHub Variables (Optional)

- `SLACK_NOTIFICATIONS_ENABLED`: Set to `true` to enable Slack notifications

## Required AWS IAM Permissions

The AWS IAM user associated with the access key needs the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

## Workflow Features

- **Automatic Deployment**: Triggered on push to main branch
- **Node.js Caching**: Caches node_modules for faster builds
- **Test Execution**: Runs tests before deployment
- **Build Artifacts**: Stores build artifacts for 5 days for debugging
- **Error Handling**: Fails gracefully with proper error messages
- **S3 Sync**: Syncs build files and removes old files
- **CloudFront Invalidation**: Ensures users see the latest content
- **Slack Notifications**: Optional deployment status notifications

## Testing the Pipeline

1. Ensure all required secrets are configured
2. Make a small change to the frontend code
3. Commit and push to the main branch
4. Monitor the Actions tab in GitHub for the workflow execution
5. Verify deployment by checking the CloudFront URL

## Troubleshooting

- **Build Failures**: Check the build artifacts for detailed error logs
- **AWS Permission Issues**: Verify IAM permissions are correctly configured
- **S3 Sync Issues**: Ensure the bucket name is correct in secrets
- **CloudFront Not Updating**: Check that the distribution ID is correct