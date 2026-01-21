# Meta (Facebook/Instagram) OAuth Setup Guide

This guide walks you through setting up direct Facebook and Instagram posting integration using Meta's Graph API.

## Prerequisites

1. A Facebook Developer account
2. A Facebook Page (required for Instagram Business Account connection)
3. An Instagram Business Account (optional, only needed for Instagram posting)

## Step 1: Create Meta App

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Click **Create App**
3. Choose **Business** as the app type
4. Fill in app details:
   - **App Name**: AI Freedom Studios (or your preferred name)
   - **App Contact Email**: Your email
   - **Business Account**: Select your business or create one
5. Click **Create App**

## Step 2: Configure App Settings

### Add Products

1. In your app dashboard, click **Add Product**
2. Add **Facebook Login** - click **Set Up**
3. In Facebook Login settings:
   - Click **Settings** in the left sidebar
   - Add **Valid OAuth Redirect URIs**:
     ```
     http://localhost:3001/auth/meta/callback
     https://yourdomain.com/auth/meta/callback
     ```
   - Save changes

### Set Permissions

1. Go to **App Review** > **Permissions and Features**
2. Request the following permissions:
   - `pages_show_list` - View list of Pages
   - `pages_read_engagement` - Read Page engagement data
   - `pages_manage_posts` - Create, edit and delete Page posts
   - `instagram_basic` - Access Instagram account
   - `instagram_content_publish` - Publish Instagram content
   - `pages_read_user_content` - Read user content on Pages

### Get App Credentials

1. Go to **Settings** > **Basic**
2. Copy:
   - **App ID** → This is your `META_APP_ID`
   - **App Secret** (click Show) → This is your `META_APP_SECRET`

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp api/.env.example api/.env
   ```

2. Add Meta credentials to `api/.env`:
   ```env
   META_APP_ID=your_app_id_from_step_2
   META_APP_SECRET=your_app_secret_from_step_2
   META_REDIRECT_URI=http://localhost:3001/auth/meta/callback
   ```

3. Generate encryption key for storing access tokens:
   ```bash
   # Generate random 32-character key
   openssl rand -hex 16
   ```
   Add to `.env`:
   ```env
   ENCRYPTION_KEY=your_generated_32_character_key
   ```

## Step 4: Test OAuth Flow

### 1. Start the Application

```bash
cd api
npm run start:dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### 2. Connect Facebook/Instagram Account

1. Navigate to your app (usually `http://localhost:3001`)
2. Go to **Settings** or **Social Accounts**
3. Click **Connect Facebook** or **Connect Instagram**
4. You'll be redirected to Facebook OAuth
5. Login with your Facebook account
6. Grant permissions to the app
7. Select which Pages to connect
8. You'll be redirected back to your app

### 3. Verify Connection

Check the database to ensure accounts were saved:
```javascript
// In MongoDB
db.socialaccounts.find({ platform: 'facebook' })
db.socialaccounts.find({ platform: 'instagram' })
```

## Step 5: Test Posting

### Schedule a Post

1. Create a creative in the app
2. Click **Schedule Post**
3. Select **Facebook** or **Instagram**
4. Set a scheduled time
5. Click **Schedule**

### Manual Test (API)

```bash
curl -X POST http://localhost:3000/api/scheduling/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "creativeId": "creative_id_here",
    "platforms": ["facebook"],
    "scheduledAt": "2026-01-23T12:00:00Z",
    "publisher": "metaDirect"
  }'
```

## Troubleshooting

### "Invalid OAuth Redirect URI"

**Problem**: OAuth callback fails with redirect URI error.

**Solution**: 
1. Check that `META_REDIRECT_URI` in `.env` exactly matches the URI in Meta App settings
2. Ensure no trailing slashes
3. Protocol (http/https) must match exactly

### "No Active Accounts Found"

**Problem**: Post fails because no social accounts are connected.

**Solution**:
1. Complete OAuth flow to connect accounts
2. Check database: `db.socialaccounts.find({ isActive: true })`
3. Ensure user has granted required permissions

### "Access Token Expired"

**Problem**: Posts fail due to expired tokens.

**Solution**:
1. Meta Page tokens are long-lived (60 days) but will eventually expire
2. Implement token refresh (future enhancement)
3. For now, reconnect the account through OAuth

### "Permissions Not Granted"

**Problem**: Can't publish posts or access Pages.

**Solution**:
1. In Meta App dashboard, verify permissions are approved
2. During OAuth, ensure user grants all requested permissions
3. Reconnect account with correct permissions

## Architecture Overview

```
User initiates OAuth
    ↓
Frontend redirects to Meta OAuth URL
    ↓
User authorizes in Facebook
    ↓
Meta redirects to /auth/meta/callback
    ↓
Backend exchanges code for access token
    ↓
Backend saves encrypted token to database
    ↓
When scheduling post:
    - Lookup user's social accounts
    - Decrypt access token
    - Post via Meta Graph API
```

## API Endpoints

### Initiate OAuth
```
GET /api/meta/auth/url?userId={userId}&tenantId={tenantId}
```

### OAuth Callback (automatic)
```
GET /api/meta/auth/callback?code={code}&state={state}
```

### List Connected Accounts
```
GET /api/social/accounts
```

### Disconnect Account
```
DELETE /api/social/accounts/:accountId
```

## Security Notes

1. **Encryption**: Access tokens are encrypted in the database using AES-256-CBC
2. **HTTPS**: Use HTTPS in production for OAuth callbacks
3. **Token Storage**: Never expose access tokens in logs or error messages
4. **Permissions**: Only request minimum required permissions
5. **App Review**: Meta requires app review for production use with other users

## Production Checklist

- [ ] Set up proper domain for OAuth redirect URI
- [ ] Use HTTPS for all OAuth callbacks
- [ ] Submit app for Meta App Review
- [ ] Configure proper error handling and logging
- [ ] Set up token refresh mechanism
- [ ] Add rate limiting for API calls
- [ ] Monitor API usage and errors
- [ ] Set up webhook for token expiration notifications

## Resources

- [Meta Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Page Publishing](https://developers.facebook.com/docs/pages/publishing)
