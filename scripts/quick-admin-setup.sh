#!/bin/bash

# Quick admin setup script for Wedding RSVP system
# This creates a default admin user with a temporary password

echo "========================================="
echo "Quick Admin User Setup for Wedding RSVP"
echo "========================================="
echo ""
echo "This will create a default admin user."
echo "IMPORTANT: Change the password after first login!"
echo ""

# Default values
DEFAULT_EMAIL="admin@wedding.himnher.dev"
DEFAULT_NAME="Admin"
DEFAULT_PASSWORD="admin"
TABLE_NAME="WeddingAdmins"
REGION="${AWS_REGION:-us-east-1}"

# Ask for email or use default
read -p "Enter admin email [$DEFAULT_EMAIL]: " EMAIL
EMAIL="${EMAIL:-$DEFAULT_EMAIL}"

# Ask for name or use default
read -p "Enter admin name [$DEFAULT_NAME]: " NAME
NAME="${NAME:-$DEFAULT_NAME}"

# Ask for password or use default
echo "Enter password (press Enter for temp password: $DEFAULT_PASSWORD)"
read -s PASSWORD
PASSWORD="${PASSWORD:-$DEFAULT_PASSWORD}"
echo ""

# Generate bcrypt hash using Node.js
echo "Generating password hash..."
HASH=$(node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('$PASSWORD', 10);
console.log(hash);
" 2>/dev/null)

if [ -z "$HASH" ]; then
    echo "Error: Failed to generate password hash."
    echo "Make sure bcryptjs is installed: npm install bcryptjs"
    exit 1
fi

# Create the DynamoDB item JSON
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ITEM_JSON=$(cat <<EOF
{
    "email": {"S": "$EMAIL"},
    "passwordHash": {"S": "$HASH"},
    "name": {"S": "$NAME"},
    "role": {"S": "SUPER_ADMIN"},
    "createdAt": {"S": "$TIMESTAMP"}
}
EOF
)

# Create the admin user in DynamoDB
echo "Creating admin user in DynamoDB..."
echo "Table: $TABLE_NAME"
echo "Region: $REGION"

aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "$ITEM_JSON" \
    --condition-expression "attribute_not_exists(email)" \
    --region "$REGION" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Admin user created successfully!"
    echo "========================================="
    echo "Email: $EMAIL"
    echo "Password: $PASSWORD"
    echo "Role: SUPER_ADMIN"
    echo "========================================="
    echo ""
    echo "You can now log in at:"
    echo "  https://wedding.himnher.dev/admin/login"
    echo ""
    if [ "$PASSWORD" = "$DEFAULT_PASSWORD" ]; then
        echo "⚠️  WARNING: You're using the default password!"
        echo "   Please change it after your first login."
    fi
else
    echo ""
    echo "❌ Failed to create admin user."
    echo ""
    echo "Possible issues:"
    echo "1. User with this email already exists"
    echo "2. Table '$TABLE_NAME' doesn't exist (deploy infrastructure first)"
    echo "3. AWS credentials not configured"
    echo ""
    echo "To check if the table exists:"
    echo "  aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION"
    echo ""
    echo "To configure AWS credentials:"
    echo "  aws configure"
fi