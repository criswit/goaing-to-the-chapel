# Wedding Admin Panel Access Guide

## Overview
The wedding website includes an admin panel for managing RSVPs, viewing statistics, and handling guest information. The admin panel is protected by JWT-based authentication.

## Admin Panel URLs

### Production
- **Login**: https://wedding.himnher.dev/admin/login
- **Dashboard**: https://wedding.himnher.dev/admin/dashboard

### Local Development
- **Login**: http://localhost:3000/admin/login
- **Dashboard**: http://localhost:3000/admin/dashboard

## Setting Up Admin Access

### Step 1: Ensure Infrastructure is Deployed

First, make sure the backend infrastructure is deployed:

```bash
npm run build
npx cdk deploy RsvpBackendStack
```

This creates:
- DynamoDB table: `WeddingAdmins`
- Admin authentication Lambda functions
- JWT key pairs in AWS Parameter Store

### Step 2: Create an Admin User

#### Option A: Using the Script (Recommended)

1. Install dependencies:
```bash
npm install
```

2. Configure AWS credentials (if not already done):
```bash
aws configure
# OR use AWS SSO
aws sso login
```

3. Run the admin creation script:
```bash
node scripts/create-admin-user.js
```

4. Follow the prompts:
   - Enter admin email address
   - Enter admin name
   - Enter password (minimum 8 characters)
   - Choose role (ADMIN or SUPER_ADMIN)

#### Option B: Manual Creation via AWS Console

1. Go to AWS DynamoDB Console
2. Find the `WeddingAdmins` table
3. Click "Create item"
4. Add the following attributes:
   - `email` (String): admin@wedding.himnher.dev
   - `passwordHash` (String): [Generate using bcrypt]
   - `name` (String): Admin Name
   - `role` (String): SUPER_ADMIN
   - `createdAt` (String): 2024-01-01T00:00:00Z

To generate a password hash manually:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('YourPasswordHere', 10);
console.log(hash);
```

### Step 3: Access the Admin Panel

1. Navigate to: https://wedding.himnher.dev/admin/login
2. Enter your admin credentials
3. You'll be redirected to the dashboard upon successful login

## Admin Panel Features

### Dashboard (`/admin/dashboard`)
- Overview of RSVP statistics
- Total guests count
- Attendance breakdown
- Recent RSVP activity

### Guest List (`/admin/guests`)
- View all guests and their RSVP status
- Search and filter guests
- Edit guest information
- Add new guests

### Bulk Operations (`/admin/bulk`)
- Import guests from CSV
- Send bulk invitations
- Update multiple RSVPs

### Export Data (`/admin/export`)
- Export guest list to CSV
- Download RSVP reports
- Generate seating charts

## User Roles

### ADMIN
- View all RSVPs
- Edit guest information
- Export data
- View statistics

### SUPER_ADMIN
- All ADMIN permissions
- Create/delete other admin users
- Modify system settings
- Access audit logs

## Troubleshooting

### Cannot Login

1. **Check credentials**: Ensure email and password are correct
2. **Check AWS region**: Verify you're in the correct AWS region
3. **Check table exists**: Confirm `WeddingAdmins` table exists in DynamoDB
4. **Check Lambda logs**: Review CloudWatch logs for the admin-auth function

### "Invalid credentials" Error

- Password is case-sensitive
- Email must match exactly (including case)
- Ensure the user exists in the WeddingAdmins table

### "Network error" or CORS Issues

- Check API Gateway is deployed
- Verify CORS settings in API Gateway
- Check browser console for specific error messages

### Token Expired

- Admin tokens expire after 24 hours
- Simply log in again to get a new token

## Security Notes

1. **Strong Passwords**: Use passwords with at least 8 characters, including uppercase, lowercase, numbers, and symbols
2. **Limit Admin Users**: Only create admin accounts for trusted individuals
3. **Regular Audits**: Periodically review admin user list and remove unnecessary accounts
4. **HTTPS Only**: Always access the admin panel via HTTPS in production

## Local Development

For local development with the admin panel:

1. Start the frontend:
```bash
cd frontend
npm start
```

2. Set environment variables:
```bash
# In frontend/.env.local
REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
```

3. Access locally at: http://localhost:3000/admin/login

## API Endpoints

The admin API includes:
- `POST /admin/auth` - Login endpoint
- `GET /admin/stats` - Get RSVP statistics
- `GET /admin/guests` - List all guests
- `POST /admin/guests` - Add new guest
- `PUT /admin/guests/{id}` - Update guest
- `DELETE /admin/guests/{id}` - Delete guest
- `POST /admin/bulk` - Bulk operations
- `GET /admin/export` - Export data

All endpoints (except `/admin/auth`) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Support

If you encounter issues:
1. Check CloudWatch logs for Lambda functions
2. Verify DynamoDB table has correct data
3. Ensure all infrastructure is deployed correctly
4. Check browser console for client-side errors