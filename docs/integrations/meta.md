# Meta (Facebook/Instagram) API Integration

## Overview
This integration allows users to connect their Facebook Pages and Instagram Business accounts to publish content directly through the Meta Graph API.

## Setup Instructions

### 1. Create a Meta (Facebook) App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in app details and create the app

### 2. Configure Facebook Login

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" as the platform
4. Add your OAuth redirect URI:
   - Development: `http://localhost:3000/auth/meta/callback`
   - Production: `https://yourdomain.com/auth/meta/callback`

### 3. Add Instagram Product

1. In app dashboard, click "Add Product"
2. Find "Instagram Graph API" and click "Set Up"
3. No additional configuration needed

### 4. Configure App Permissions

In the "App Review" → "Permissions and Features" section, request the following permissions:

**Required Permissions:**
- `pages_manage_posts` - Create, edit and delete posts on Pages
- `pages_manage_engagement` - Manage Page interactions
- `pages_read_engagement` - Read Page engagement data
- `instagram_basic` - Access Instagram accounts
- `instagram_content_publish` - Publish content to Instagram

**Optional (for advanced features):**
- `pages_show_list` - List all Pages
- `publish_video` - Publish videos to Pages

### 5. Get App Credentials

1. Go to "Settings" → "Basic"
2. Copy your **App ID** and **App Secret**
3. Add these to your environment variables

### 6. Environment Variables

#### Backend (NestJS API)
Add to `.env` or environment configuration:

```env
# Not required on backend - credentials come from frontend
```

#### Frontend (Next.js)
Add to `.env.local`:

```env
NEXT_PUBLIC_META_APP_ID=your_app_id_here
NEXT_PUBLIC_META_APP_SECRET=your_app_secret_here
```

⚠️ **Security Note:** In production, the app secret should NOT be in frontend env vars. Instead, store it only on the backend and have the frontend call a backend endpoint that handles the token exchange securely.

## OAuth Flow

### User Journey

1. **User clicks "Connect Accounts"** in SocialConnectionsCard
2. **Redirected to Facebook OAuth** dialog
3. **User grants permissions** to access their Pages and Instagram
4. **Redirected back to app** at `/auth/meta/callback`
5. **Backend exchanges code for tokens**:
   - Short-lived user access token (1 hour)
   - Long-lived user access token (60 days)
   - Page access tokens (never expire unless permissions revoked)
6. **Frontend fetches user's Pages**
7. **For each Page, check for linked Instagram Business account**
8. **Store connected accounts** in database
9. **User redirected to dashboard** with accounts connected

### Technical Flow

```
1. Frontend: Generate OAuth URL
   GET https://www.facebook.com/v24.0/dialog/oauth
   ?client_id={app_id}
   &redirect_uri={callback_url}
   &state={csrf_token}
   &scope=pages_manage_posts,instagram_content_publish,...
   &response_type=code

2. User authorizes → Redirect to callback with code

3. Backend: Exchange code for token
   GET https://graph.facebook.com/v24.0/oauth/access_token
   ?client_id={app_id}
   &client_secret={app_secret}
   &redirect_uri={callback_url}
   &code={auth_code}
   
   Response: { access_token, token_type, expires_in }

4. Backend: Get long-lived token (60 days)
   GET https://graph.facebook.com/v24.0/oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id={app_id}
   &client_secret={app_secret}
   &fb_exchange_token={short_lived_token}
   
   Response: { access_token, token_type, expires_in }

5. Get user's Pages with Page access tokens
   GET https://graph.facebook.com/v24.0/me/accounts
   ?access_token={user_access_token}
   
   Response: { data: [{ id, name, access_token, ... }] }

6. For each Page, get Instagram Business account
   GET https://graph.facebook.com/v24.0/{page_id}
   ?fields=instagram_business_account{id,username,name}
   &access_token={page_access_token}
   
   Response: { instagram_business_account: { id, username, name } }
```

## API Endpoints

### Backend (NestJS)

#### OAuth Endpoints

```
POST /api/meta/auth/url
Body: { appId, appSecret, redirectUri, state, scope? }
Response: { url: string }
Description: Generate OAuth authorization URL

POST /api/meta/auth/token
Body: { appId, appSecret, redirectUri, code }
Response: { access_token, token_type, expires_in }
Description: Exchange authorization code for access token

POST /api/meta/auth/long-lived-token
Body: { appId, appSecret, shortLivedToken }
Response: { access_token, token_type, expires_in }
Description: Get long-lived (60 day) access token

POST /api/meta/auth/debug
Body: { inputToken, appAccessToken }
Response: Token debug info
Description: Debug/validate an access token
```

#### Account Endpoints

```
GET /api/meta/pages?accessToken={token}
Response: Array of Page objects with access tokens
Description: Get user's Facebook Pages

GET /api/meta/pages/:pageId/instagram?accessToken={token}
Response: { id, username, name } or null
Description: Get Instagram Business account linked to Page
```

#### Publishing Endpoints

```
POST /api/meta/facebook/post
Body: { pageId, accessToken, options: { message, link, published, ... } }
Response: { id: post_id }
Description: Create post on Facebook Page

POST /api/meta/facebook/photo
Body: { pageId, accessToken, photoUrl, caption? }
Response: { id: photo_id, post_id }
Description: Post photo to Facebook Page

POST /api/meta/instagram/post
Body: { instagramAccountId, accessToken, options: { image_url?, video_url?, caption, ... } }
Response: { id: media_id, containerId }
Description: Post to Instagram (photos, videos, reels)

POST /api/meta/instagram/container
Body: { instagramAccountId, accessToken, options }
Response: { id: container_id }
Description: Create Instagram media container (Step 1)

POST /api/meta/instagram/publish
Body: { instagramAccountId, accessToken, creationId }
Response: { id: media_id }
Description: Publish Instagram container (Step 2)

GET /api/meta/instagram/container/:containerId/status?accessToken={token}
Response: { status_code: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' | 'EXPIRED' | 'PUBLISHED' }
Description: Check container publishing status
```

## Publishing Examples

### Facebook Page Post

```typescript
// Text post
POST /api/meta/facebook/post
{
  "pageId": "123456789",
  "accessToken": "page_access_token",
  "options": {
    "message": "Hello from our API!",
    "published": true
  }
}

// Scheduled post
POST /api/meta/facebook/post
{
  "pageId": "123456789",
  "accessToken": "page_access_token",
  "options": {
    "message": "Scheduled post",
    "published": false,
    "scheduled_publish_time": 1735689600  // Unix timestamp
  }
}

// Photo post
POST /api/meta/facebook/photo
{
  "pageId": "123456789",
  "accessToken": "page_access_token",
  "photoUrl": "https://example.com/photo.jpg",
  "caption": "Check out this photo!"
}
```

### Instagram Post

```typescript
// Photo post
POST /api/meta/instagram/post
{
  "instagramAccountId": "987654321",
  "accessToken": "page_access_token",
  "options": {
    "image_url": "https://example.com/photo.jpg",
    "caption": "Amazing photo! #instagram"
  }
}

// Video post
POST /api/meta/instagram/post
{
  "instagramAccountId": "987654321",
  "accessToken": "page_access_token",
  "options": {
    "video_url": "https://example.com/video.mp4",
    "caption": "Check out this video!",
    "media_type": "VIDEO"
  }
}

// Reel
POST /api/meta/instagram/post
{
  "instagramAccountId": "987654321",
  "accessToken": "page_access_token",
  "options": {
    "video_url": "https://example.com/reel.mp4",
    "caption": "New reel! #reels",
    "media_type": "REELS"
  }
}

// Story
POST /api/meta/instagram/post
{
  "instagramAccountId": "987654321",
  "accessToken": "page_access_token",
  "options": {
    "image_url": "https://example.com/story.jpg",
    "media_type": "STORIES"
  }
}
```

## Important Notes

### Token Management

- **User Access Tokens**: Expire in 60 days with long-lived exchange
- **Page Access Tokens**: Never expire unless permissions are revoked
- **Store tokens securely** in your database encrypted
- **Refresh tokens** before expiry to maintain access

### Instagram Requirements

- Instagram account must be a **Professional** or **Business** account
- Must be **linked to a Facebook Page**
- Page must have **Page Publishing Authorization** if required
- Cannot be a personal Instagram account

### Rate Limits

- **Instagram**: 100 API-published posts per 24 hours per account
- **Facebook**: No official rate limit but use reasonable posting frequency
- Check current usage: `GET /<IG_ID>/content_publishing_limit`

### Media Requirements

- **Images**: JPEG only, hosted on public server
- **Videos**: Must be on public server, MP4 format recommended
- **Instagram videos**: Max 60 seconds for feed, up to 90 seconds for reels
- Media must be accessible via HTTPS

### Permissions

- Users must grant all required permissions
- If permissions are declined, re-request with `auth_type=rerequest`
- Check permissions: `GET /me/permissions`

## Troubleshooting

### "App not set up for Instagram Graph API"
- Ensure Instagram product is added in app dashboard
- Complete app review for required permissions

### "Instagram account not found"
- Ensure Instagram account is Professional/Business
- Verify it's linked to the Facebook Page
- Check Page access token has correct permissions

### "Container status ERROR"
- Check media URL is publicly accessible
- Verify media format (JPEG for images)
- Ensure caption doesn't exceed character limits
- Check for invalid characters or hashtags

### "Token expired"
- Exchange for long-lived token
- Implement token refresh before expiry
- Store `expires_in` and refresh proactively

### "Permission denied"
- User hasn't granted required permissions
- Re-request with `auth_type=rerequest`
- Check Page tasks (CREATE_CONTENT, MANAGE, MODERATE)

## Security Best Practices

1. **Never expose app secret** in frontend code
2. **Validate state parameter** in OAuth callback (CSRF protection)
3. **Store tokens encrypted** in database
4. **Use HTTPS** for all API calls
5. **Implement token rotation** before expiry
6. **Log OAuth attempts** for audit trail
7. **Rate limit** your API endpoints
8. **Validate media URLs** before posting

## Next Steps

1. Complete app review for production permissions
2. Set up App Dashboard webhook for deauthorization events
3. Implement token refresh mechanism
4. Add error handling for specific error codes
5. Create UI for managing connected accounts
6. Add analytics and insights fetching
7. Implement scheduling system for posts
8. Add support for Facebook Videos API
