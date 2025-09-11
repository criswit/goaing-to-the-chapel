# Quick Admin Setup Guide

## 1. Deploy the Backend (REQUIRED FIRST)

```bash
# Build the project
npm run build

# Deploy the backend stack
npx cdk deploy RsvpBackendStack
```

This deployment will output two important URLs:
- **ApiEndpoint**: Main API for RSVP functions
- **AdminApiEndpoint**: Admin API for login and management

## 2. Get Your Admin API URL

After deployment completes, look for the output that says:
```
Outputs:
RsvpBackendStack.AdminApiEndpoint = https://[YOUR-API-ID].execute-api.us-east-1.amazonaws.com/prod
```

Copy this URL - you'll need it for the frontend configuration.

## 3. Update Frontend Configuration

Edit `frontend/.env.local` and add your Admin API URL:

```env
REACT_APP_API_URL=https://dx489wk9ik.execute-api.us-east-1.amazonaws.com/production
REACT_APP_ADMIN_API_URL=https://[YOUR-ADMIN-API-ID].execute-api.us-east-1.amazonaws.com/prod
```

## 4. Create Your Admin User

```bash
node scripts/create-mbgoose-admin.js
```

## 5. Start the Frontend

```bash
cd frontend
npm install
npm start
```

## 6. Login

Navigate to http://localhost:3000/admin/login

**Credentials:**
- Email: espoused@wedding.himnher.dev
- Password: goaingtothechapel

## Troubleshooting

### CORS Error
If you still get CORS errors after deployment:
1. The deployment might take a few minutes to propagate
2. Try clearing your browser cache
3. Make sure you're using the Admin API URL, not the main API URL

### "Failed to fetch" Error
This usually means:
1. The backend isn't deployed yet
2. You're using the wrong API URL
3. AWS credentials aren't configured

### Admin User Already Exists
If the script says the user already exists, you can just proceed to login.

## Important Notes

- The Admin API is SEPARATE from the main RSVP API
- You MUST deploy the backend first before trying to login
- The CORS fix allows all origins (*) for development
- In production, you should restrict CORS to your actual domain