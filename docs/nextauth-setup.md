# NextAuth.js Setup Guide for F1 Race Simulator

This guide will help you set up NextAuth.js with Google OAuth for the F1 Race Simulator.

## Prerequisites

- Google Cloud Console account
- Node.js and npm installed
- F1 Race Simulator project cloned

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project or Select Existing
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "F1 Race Simulator"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Copy the **Client ID** and **Client Secret**

## Step 2: Environment Variables

### 2.1 Update .env.local
Add these variables to your `.env.local` file:

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=YKKRYzJytwuejDWbcB274goIrylgHzmZWoxZFWL0+4g=
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
```

**Important:** Replace the placeholder values with your actual Google OAuth credentials.

### 2.2 Generate Your Own Secret (Optional)
If you want to generate a new secret:
```bash
openssl rand -base64 32
```

## Step 3: Verify Configuration

### 3.1 Check Environment Variables
Ensure your `.env.local` file contains all required variables:
- `NEXTAUTH_SECRET` - A secure random string
- `NEXTAUTH_URL` - Your application URL
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

### 3.2 Restart Development Server
After updating environment variables:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Step 4: Test Authentication

### 4.1 Start the Application
```bash
npm run dev
```

### 4.2 Test Sign In
1. Open your browser to `http://localhost:3000`
2. Click "Sign In with Google"
3. You should be redirected to Google's OAuth consent screen
4. After authorization, you should be redirected back to the app

## Troubleshooting

### Common Issues

#### 1. "client_id is required" Error
- **Cause**: Missing or incorrect `GOOGLE_CLIENT_ID` in environment variables
- **Solution**: Verify `.env.local` has the correct Google OAuth credentials

#### 2. "redirect_uri_mismatch" Error
- **Cause**: Redirect URI in Google Cloud Console doesn't match your app URL
- **Solution**: Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

#### 3. "invalid_client" Error
- **Cause**: Incorrect `GOOGLE_CLIENT_SECRET`
- **Solution**: Verify the client secret in `.env.local` matches Google Cloud Console

#### 4. Environment Variables Not Loading
- **Cause**: Next.js not picking up `.env.local` changes
- **Solution**: Restart the development server after changing environment variables

### Debug Steps
1. Check browser console for errors
2. Verify environment variables are loaded:
   ```bash
   echo $NEXTAUTH_SECRET
   echo $GOOGLE_CLIENT_ID
   ```
3. Check NextAuth.js logs in terminal
4. Verify Google Cloud Console configuration

## Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Update `NEXTAUTH_URL` to your production domain
3. Add production redirect URI in Google Cloud Console

### Environment Variables for Production
```bash
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique secrets for production
- Regularly rotate OAuth credentials
- Monitor OAuth usage in Google Cloud Console

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review NextAuth.js documentation
3. Check Google Cloud Console logs
4. Verify environment variable configuration
