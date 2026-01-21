# Meta OAuth Configuration - Fixing App Activation Issues

## Current Problem
Your Meta App (ID: 1545711426637702) is showing:
1. **"App not active"** - App is disabled or missing required use cases
2. **"Can't load URL"** - Redirect URI domain not whitelisted

## Root Cause: Missing Use Cases

Your app is currently configured for **Marketing APIs only**, but **Facebook Login** requires specific use cases to be enabled. The app must declare its purpose for OAuth authentication.

## Solution Steps

### Step 1: Add Required Use Cases

1. Go to: https://developers.facebook.com/apps/1545711426637702/
2. In the left sidebar, find **"Use Cases"** (or **"Products"**)
3. Click **"Add Use Cases"**
4. **Select and add these use cases:**
   - ✅ **"Share or create fundraisers on Facebook and Instagram"** (if collecting payments)
   - ✅ **"Manage everything on your Page"** (for posting content)
   - ✅ **"Manage messaging and content on Instagram"** (for Instagram content)
   - ✅ **"Embed Facebook, Instagram and Threads content in other websites"** (optional)
   
5. Click **"Finish"** after selecting use cases

### Step 2: Verify Facebook Login Product is Added

1. Still in the app dashboard
2. Look for **"Products"** or **"Add Product"** section
3. Search for **"Facebook Login"**
4. If not present, click **"Add"** next to Facebook Login
5. Choose setup type:
   - Select **"Web"** (since you're using a web app)
   - Click **"Next"**

### Step 3: Activate Your Meta App

1. Go to: https://developers.facebook.com/apps/1545711426637702/settings/basic/
2. Look at the top of the page for **App Status**
3. If it says "**Development**" or "**Inactive**":
   - Click the status indicator
   - Select "**Development**" mode (for testing)

4. **Switch to Development Mode** (quickest for testing):
   - Your app will be in Development mode by default
   - You can immediately use it for testing

### Step 4: Add Your Domain to App Domains

1. Still on Settings → Basic page
2. Scroll down to find **"App Domains"** field
3. Add these domains (one per line):
   ```
   localhost
   127.0.0.1
   aifreedompstudios.com (if you have a production domain)
   ```
4. Click **Save Changes**

### Step 5: Configure Facebook Login Settings

1. Go to: https://developers.facebook.com/apps/1545711426637702/
2. In the left sidebar, click **"Facebook Login"** → **"Settings"**

### Step 5: Configure Facebook Login Settings

1. Go to: https://developers.facebook.com/apps/1545711426637702/
2. In the left sidebar, click **"Facebook Login"** → **"Settings"**
3. In **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:3001/api/meta/auth/callback
   http://127.0.0.1:3001/api/meta/auth/callback
   ```
4. For production, also add:
   ```
   https://aifreedompstudios.com/api/meta/auth/callback
   ```
5. Click **"Save Changes"**

### Step 6: Add Yourself as Test User (Development Mode Only)

1. Go to: https://developers.facebook.com/apps/1545711426637702/roles/test-users/
2. Click **"Add Test User"**
3. Enter your Facebook account email or phone
4. Choose **"Administrator"** role
5. Click **"Create Test User"**

### Step 7: Verify Permissions

1. Go to Settings → Basic
2. Under **"App Roles"**, verify you're listed as:
   - Administrator (or higher)
3. Under **"App Developers"**, verify your account is there

### Step 8: Required Permissions

Make sure your app has these permissions configured:
- `public_profile`
- `pages_manage_posts`
- `pages_read_engagement`
- `instagram_basic`
- `instagram_content_publish`

1. Go to Settings → Basic
2. Scroll to **"Permissions"** section
3. Ensure the above are checked

### Step 9: Environment Variables Check

Verify your `.env` file has:
```dotenv
META_APP_ID=1545711426637702
META_APP_SECRET=3a7808783f45c4b495e8362ff3224594
META_REDIRECT_URI=http://localhost:3001/api/meta/auth/callback
```

### Step 10: Restart Your Servers

After making changes in Facebook Developer Console:

**Local Development:**
```bash
npm run dev
```

**Production Server:**
```bash
cd /var/www/website
git pull origin main
pm2 restart all
```

## Testing the OAuth Flow

1. Go to: http://localhost:3000/app/settings
2. Click **"Connect Facebook/Instagram"**
3. You should now be redirected to Facebook login
4. After login, you'll be redirected back to your app with the auth code
5. Your account will be connected!

## Troubleshooting

| Error | Solution |
|-------|----------|
| "App not active" | Switch app to Development mode in Settings |
| "Can't load URL" | Add `localhost` to App Domains |
| "Redirect URI mismatch" | Ensure URL matches exactly (including http/https) |
| "OAuth error" | Clear browser cookies and try again |
| "Invalid client ID" | Verify META_APP_ID matches app settings |

## For Production Deployment

1. Change app from Development to Live mode
2. Update `META_REDIRECT_URI` to your production URL:
   ```dotenv
   META_REDIRECT_URI=https://aifreedompstudios.com/api/meta/auth/callback
   ```
3. Submit app for App Review (Facebook requires this for live access)
4. Restart servers after configuration changes

## Support Links

- [Facebook App Settings](https://developers.facebook.com/apps/1545711426637702/settings/basic/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Test Users Documentation](https://developers.facebook.com/docs/development/create-test-users)
