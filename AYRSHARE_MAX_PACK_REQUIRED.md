# Ayrshare Max Pack Requirement

## Current Status

The social account linking feature requires **Ayrshare Max Pack** subscription, which is currently not active on the account.

### Error Encountered
```
Max Pack is required. Please go to your Account page in the Ayrshare Dashboard to activate the Max Pack.
```

## What is Max Pack?

Max Pack is an additional paid add-on to the Ayrshare Business Plan that provides:
- **JWT Generation** - Required for user social account linking OAuth flow
- **Longer JWT Expiration** - Allows emailing links to users (default is 5 minutes)
- **AI-Generated Posts** - Text generation, rewriting, video transcription
- **Link Shortening with Analytics** - Custom domain support
- **Image Resizing & Effects** - Social network compatible sizes, watermarks
- **Alt Text Generation** - AI-generated image descriptions
- **Text Translation** - Over 100 languages
- **Sentiment Analysis** - Post/comment sentiment analysis
- **Advanced Customizations** - Custom CSS, favicon, page title for linking page
- **Staging Server** - Testing environment with up to 30 user profiles

## Why is Max Pack Required?

The `/generateJWT` endpoint is a **Max Pack exclusive feature**. This endpoint is essential for the user integration flow:

1. Backend creates a user profile → receives Profile Key
2. Backend calls `/generateJWT` with Profile Key → receives JWT token
3. Frontend opens authorization URL with JWT → user connects social accounts
4. User completes OAuth flow → profile is linked to social accounts

**Without Max Pack, there is no alternative API-based method for users to connect their social accounts.**

## Next Steps

### Option 1: Activate Max Pack (Recommended for Production)

1. Log into [Ayrshare Dashboard](https://app.ayrshare.com/)
2. Navigate to "Account" page
3. Click "Learn More ->" under Max Pack section
4. Review pricing and features
5. Activate Max Pack subscription

### Option 2: Manual Profile Creation (Temporary Workaround)

For development/testing, you can manually create profiles and connect accounts via the Ayrshare Dashboard:

1. Go to [Ayrshare Dashboard](https://app.ayrshare.com/)
2. Navigate to "User Profiles"
3. Click "Create Profile"
4. Get the Profile Key from the profile
5. Manually connect social accounts through the dashboard
6. Use the Profile Key in API calls for posting

**Note:** This workaround doesn't scale for end-user self-service and is only suitable for development/testing.

### Option 3: Contact Ayrshare Support

If you need to discuss pricing, volume discounts, or enterprise features:
- Email: support@ayrshare.com
- Visit: https://www.ayrshare.com/business-plan-for-multiple-users/#contactbusiness

## Implementation Status

### ✅ Completed
- Correct OAuth flow implementation (profile creation → JWT generation)
- Error handling for Max Pack requirement
- User-friendly error messages in frontend
- Documentation of OAuth flow in `docs/ayrshare-integration.md`

### ⏸️ Blocked (Requires Max Pack)
- User self-service social account linking
- Automated OAuth authorization flow
- Frontend "Connect Accounts" button functionality

### 🔄 Alternative Available
- Manual profile creation via Ayrshare Dashboard
- API-based posting with manually created profiles
- All other Ayrshare features (posting, analytics, scheduling, etc.)

## Code Changes

The following endpoints are ready but require Max Pack to function:

**Backend:**
- `POST /api/social-accounts/profiles/create` - Create new user profile
- `POST /api/social-accounts/connect/jwt-new` - Create profile + generate JWT
- `POST /api/social-accounts/profiles/:profileKey/jwt` - Generate JWT with existing profile key

**Frontend:**
- `SocialConnectionsCard` component with "Connect accounts" button
- Error handling for Max Pack requirement

## Documentation

Updated documentation in `docs/ayrshare-integration.md` includes:
- Complete OAuth flow explanation
- Step-by-step user integration guide
- Max Pack feature requirements
- API endpoint reference

## Cost Considerations

Max Pack is an add-on to the Business Plan. Pricing details:
- Available through Ayrshare Dashboard
- Contact sales for volume pricing
- Required for production multi-user scenarios

## Recommendations

1. **For Production:** Activate Max Pack to enable full user self-service functionality
2. **For Development:** Use manual profile creation in dashboard for testing
3. **For MVP:** Consider if manual account linking via dashboard is acceptable initially
4. **Long-term:** Max Pack is essential for scalable multi-user social media management

---

**Last Updated:** December 30, 2024
**Status:** Max Pack activation required for social account linking feature
