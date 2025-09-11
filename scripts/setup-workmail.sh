#!/bin/bash

# WorkMail Setup Script for wedding.himnher.dev
# This script helps create a WorkMail organization since it can't be done through CloudFormation

set -e

ORGANIZATION_ALIAS="goaing-to-the-chapel"
DOMAIN_NAME="wedding.himnher.dev"
REGION="${AWS_REGION:-us-east-1}"

echo "==================================="
echo "WorkMail Organization Setup Script"
echo "==================================="
echo "Organization Alias: $ORGANIZATION_ALIAS"
echo "Domain: $DOMAIN_NAME"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS CLI is not configured. Please configure your AWS credentials first."
    exit 1
fi

echo "Checking if WorkMail organization already exists..."
EXISTING_ORG=$(aws workmail list-organizations --region $REGION --query "OrganizationSummaries[?Alias=='$ORGANIZATION_ALIAS'].OrganizationId" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ORG" ]; then
    echo "WorkMail organization '$ORGANIZATION_ALIAS' already exists with ID: $EXISTING_ORG"
    ORG_ID=$EXISTING_ORG
else
    echo "Creating WorkMail organization..."
    
    # Create KMS key for WorkMail
    echo "Creating KMS key for encryption..."
    KMS_KEY_ID=$(aws kms create-key \
        --region $REGION \
        --description "KMS key for WorkMail organization $ORGANIZATION_ALIAS" \
        --query 'KeyMetadata.KeyId' \
        --output text)
    
    echo "KMS Key created: $KMS_KEY_ID"
    
    # Create alias for the KMS key
    aws kms create-alias \
        --region $REGION \
        --alias-name "alias/workmail-$ORGANIZATION_ALIAS" \
        --target-key-id $KMS_KEY_ID
    
    # Grant WorkMail permission to use the key
    aws kms put-key-policy \
        --region $REGION \
        --key-id $KMS_KEY_ID \
        --policy-name default \
        --policy "{
            \"Version\": \"2012-10-17\",
            \"Statement\": [
                {
                    \"Sid\": \"Enable IAM User Permissions\",
                    \"Effect\": \"Allow\",
                    \"Principal\": {
                        \"AWS\": \"arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):root\"
                    },
                    \"Action\": \"kms:*\",
                    \"Resource\": \"*\"
                },
                {
                    \"Sid\": \"Allow WorkMail to use the key\",
                    \"Effect\": \"Allow\",
                    \"Principal\": {
                        \"Service\": \"workmail.amazonaws.com\"
                    },
                    \"Action\": [
                        \"kms:Decrypt\",
                        \"kms:GenerateDataKey\",
                        \"kms:CreateGrant\",
                        \"kms:DescribeKey\"
                    ],
                    \"Resource\": \"*\",
                    \"Condition\": {
                        \"StringEquals\": {
                            \"kms:ViaService\": \"workmail.$REGION.amazonaws.com\"
                        }
                    }
                }
            ]
        }"
    
    # Create WorkMail organization
    echo "Creating WorkMail organization..."
    ORG_ID=$(aws workmail create-organization \
        --region $REGION \
        --alias $ORGANIZATION_ALIAS \
        --kms-key-arn "arn:aws:kms:$REGION:$(aws sts get-caller-identity --query Account --output text):key/$KMS_KEY_ID" \
        --query 'OrganizationId' \
        --output text)
    
    echo "WorkMail organization created with ID: $ORG_ID"
fi

# Register the domain
echo ""
echo "Registering domain $DOMAIN_NAME with WorkMail organization..."
aws workmail register-mail-domain \
    --region $REGION \
    --organization-id $ORG_ID \
    --domain-name $DOMAIN_NAME 2>/dev/null || echo "Domain might already be registered"

# Set as default domain
echo "Setting $DOMAIN_NAME as default domain..."
aws workmail put-mail-domain \
    --region $REGION \
    --organization-id $ORG_ID \
    --domain-name $DOMAIN_NAME \
    --default-domain 2>/dev/null || true

echo ""
echo "==================================="
echo "WorkMail Organization Setup Complete!"
echo "==================================="
echo ""
echo "Organization ID: $ORG_ID"
echo "Organization Alias: $ORGANIZATION_ALIAS"
echo "Domain: $DOMAIN_NAME"
echo ""
echo "Next steps:"
echo "1. Add the following DNS records to your Route53 hosted zone:"
echo "   - MX record: 10 inbound-smtp.$REGION.amazonaws.com"
echo "   - AutoDiscover CNAME: autodiscover.$DOMAIN_NAME -> autodiscover.mail.$REGION.awsapps.com"
echo "   - SPF TXT record: v=spf1 include:amazonses.com include:spf.mail.$REGION.awsapps.com ~all"
echo "   - DMARC TXT record (_dmarc): v=DMARC1; p=quarantine; rua=mailto:admin@$DOMAIN_NAME"
echo ""
echo "2. Go to AWS WorkMail console to:"
echo "   - Create users and groups"
echo "   - Set up email addresses"
echo "   - Configure additional settings"
echo ""
echo "3. Access webmail at: https://$ORGANIZATION_ALIAS.awsapps.com/mail"
echo ""
echo "4. Configure email clients with:"
echo "   - Server: outlook.$REGION.amazonaws.com"
echo "   - Protocol: EWS (Exchange Web Services)"
echo ""