# Social Media & Platform Integrations

Setup guides for connecting social media platforms and external services.

## 🚀 Available Integrations

### [Meta (Facebook/Instagram)](./meta.md) - **RECOMMENDED FOR FREE TIER**
Direct integration with Meta Graph APIs for Facebook Pages and Instagram posting.

**Features:**
- Native OAuth 2.0 authentication
- Post to Facebook Pages
- Post to Instagram (photos, videos, reels)
- Page and Instagram account discovery
- Rate limits: 100 posts/24 hours per Instagram account
- **Cost:** Free (within rate limits)

**Best For:**
- Customers focusing on Facebook and Instagram
- Users wanting native, direct control
- No subscription fees

**Setup Time:** ~15 minutes

**See:** [Meta Integration Guide](./meta.md)

---

### [Ayrshare](./ayrshare.md) - **MULTI-PLATFORM SOLUTION (PAID)**
Unified API for publishing to 13+ social platforms with a single service.

**Supported Platforms:**
- Twitter/X
- LinkedIn
- Facebook
- Instagram
- YouTube
- TikTok
- Pinterest
- Tumblr
- Discord
- Mastodon
- Medium
- Bluesky
- And more...

**Features:**
- Single API for all platforms
- Scheduling and auto-post
- Media handling (auto-resize for each platform)
- Analytics
- User OAuth linking (requires $200+/month Max Pack add-on)
- Content queuing

**Cost:** 
- Business Plan: Starting price varies
- Max Pack (User OAuth): $200+/month additional

**Best For:**
- Multi-platform publishing
- Enterprise customers
- Using many different social networks

**Setup Time:** ~20 minutes

**See:** [Ayrshare Integration Guide](./ayrshare.md)

---

### [Replicate AI](./replicate.md)
AI image and video generation for creative assets.

**Features:**
- Text-to-image generation
- Image manipulation and enhancement
- Video generation
- Fine-tuned model support
- Easy integration with campaign workflows

**Cost:** Pay-per-generation model

**See:** [Replicate Integration Guide](./replicate.md)

---

## 🔄 Integration Comparison

| Feature | Meta | Ayrshare | Replicate |
|---------|------|----------|-----------|
| **Purpose** | Social posting | Social posting | Content generation |
| **Platforms** | Facebook, Instagram | 13+ networks | N/A |
| **Cost** | Free | $200+/month | Pay-per-use |
| **Auth** | Native OAuth | OAuth (with Max Pack) | API key |
| **Setup Time** | ~15 min | ~20 min | ~10 min |
| **Best For** | FB/Instagram only | Multi-platform | AI-generated content |

## 🛠️ Setup Checklist

### For Social Posting (Choose One)
- [ ] **Option 1: Meta Only** - Follow [Meta Integration](./meta.md)
  - Setup Meta Developers account
  - Create Facebook App
  - Configure OAuth redirect URI
  - Get App ID and App Secret
  - Set environment variables

- [ ] **Option 2: Multi-Platform (Ayrshare)** - Follow [Ayrshare Integration](./ayrshare.md)
  - Create Ayrshare account
  - Purchase Business Plan
  - (Optional) Purchase Max Pack for user OAuth
  - Get API key
  - Set environment variables

### For AI Content Generation
- [ ] Follow [Replicate Integration](./replicate.md)
  - Create Replicate account
  - Generate API token
  - Set environment variable
  - Test image/video generation

## 📝 Environment Variables

### Meta Integration
```env
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URI=https://yourdomain.com/auth/meta/callback
META_GRAPH_API_VERSION=v18.0
```

### Ayrshare Integration
```env
AYRSHARE_API_KEY=your_api_key
AYRSHARE_SANDBOX_MODE=false  # true for testing
```

### Replicate Integration
```env
REPLICATE_API_TOKEN=your_api_token
```

## 🔐 Security Best Practices

1. **Never commit secrets** - Use environment variables only
2. **Store tokens securely** - Encrypt all OAuth tokens in database
3. **Rotate credentials** - Regularly update API keys
4. **Validate webhooks** - Verify webhook signatures from platforms
5. **Rate limiting** - Respect platform rate limits
6. **Token refresh** - Auto-refresh long-lived tokens before expiration

## 🚨 Common Issues

### Meta OAuth Issues
- **"Invalid redirect URI"** - Ensure redirect URI matches exactly in Meta app settings
- **"Invalid state parameter"** - Check CSRF token validation in callback handler
- **"Token expired"** - Implement token refresh for long-lived tokens

### Ayrshare Issues
- **"Max Pack required"** - User OAuth requires $200+/month Max Pack subscription
- **"API key invalid"** - Verify key format and permissions
- **"Rate limit exceeded"** - Queue requests or upgrade plan

### Replicate Issues
- **"Model not found"** - Verify model name matches Replicate registry
- **"Timeout"** - Large models may take time, increase timeout

## 📚 Additional Resources

- [Meta Developers](https://developers.facebook.com/)
- [Ayrshare Documentation](https://docs.ayrshare.com/)
- [Replicate Models](https://replicate.com/explore)

## 🔗 Related Documentation

- **API Reference**: See `/docs/api/` for endpoint details
- **Architecture**: See `/docs/architecture/` for system design
- **Guides**: See `/docs/guides/` for implementation procedures

---

**Recommendation:** Start with Meta for Facebook/Instagram users. Add Ayrshare later if multi-platform support is needed. Use Replicate for AI-generated content in your campaigns.
