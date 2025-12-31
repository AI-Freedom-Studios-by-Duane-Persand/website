# Quick Start Guide

Get up and running with AI Freedom Studios in 15 minutes.

## Prerequisites

- Node.js 18 or higher
- MongoDB (local or Atlas)
- npm or pnpm

## Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/AI-Freedom-Studios-by-Duane-Persand/website.git
cd website

# Install dependencies
npm install
```

## Step 2: Configure Environment

### Backend Configuration (`/api/.env`)

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_secret_key_here_make_it_long

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Meta APIs (for Facebook/Instagram posting)
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/auth/meta/callback
META_GRAPH_API_VERSION=v18.0

# Storage (Cloudflare R2)
R2_BUCKET=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarecontent.com

# AI Providers
GEMINI_API_KEY=your_gemini_key
REPLICATE_API_TOKEN=your_replicate_token
POE_API_KEY=your_poe_key (optional)

# Redis (for job queue)
REDIS_URL=redis://localhost:6379
```

### Frontend Configuration (`/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

## Step 3: Start Development Servers

### Terminal 1 - Backend
```bash
npm run dev:api
# Backend will start on http://localhost:3001
```

### Terminal 2 - Frontend
```bash
npm run dev:frontend
# Frontend will start on http://localhost:3000
```

## Step 4: Create Your First Campaign

1. Open http://localhost:3000 in your browser
2. Click "Sign Up"
3. Enter email and password
4. Verify email (check console for verification link)
5. Log in
6. Create a campaign:
   - Click "New Campaign"
   - Fill in campaign details
   - Add strategy and content
   - Schedule posts
7. Connect social account:
   - Go to "Social Accounts"
   - Click "Connect Meta (Facebook/Instagram)"
   - Authorize with your Facebook account
   - Select Pages to manage

## Step 5: Generate Content (Optional)

To use AI content generation:

1. Ensure `GEMINI_API_KEY` or `POE_API_KEY` is set
2. In a campaign, click "Generate Creative"
3. System will generate images, videos, and captions
4. Review and publish

## ✅ You're Ready!

Congratulations! You now have:
- ✅ Local development environment
- ✅ Database connection
- ✅ Social media integration (Meta)
- ✅ Campaign management system
- ✅ Content generation (optional)

## 🔗 Next Steps

- **Learn the Platform**: See [Getting Started Guide](./docs/guides/GETTING_STARTED.md)
- **Explore Features**: See [Implementation Summary](./docs/guides/IMPLEMENTATION_SUMMARY.md)
- **Deploy to Production**: See [POST_IMPLEMENTATION_CHECKLIST.md](./POST_IMPLEMENTATION_CHECKLIST.md)
- **Understand Architecture**: See [System Overview](./docs/architecture/system-overview.md)
- **API Reference**: See [API Documentation](./docs/api/)

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port for backend
PORT=3002 npm run dev:api

# Change port for frontend
npm run dev:frontend -- -p 3001
```

### MongoDB Connection Error
- Check `MONGODB_URI` is correct
- Ensure IP whitelist includes your IP (MongoDB Atlas)
- Verify username and password

### Missing Environment Variables
```bash
# List all required env vars
grep "process.env" api/src/**/*.ts | grep -oP 'process\.env\.\K\w+' | sort -u
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:all
```

## 📚 Documentation

- [README.md](./README.md) - Project overview
- [Documentation Hub](./docs/) - Complete documentation
- [API Reference](./docs/api/api_endpoints.md) - All endpoints
- [Integration Guides](./docs/integrations/) - Social media setup
- [Architecture](./docs/architecture/) - System design

## 💡 Tips

1. **Use Test Mode**: Use Stripe test keys for development
2. **Meta Test App**: Create a test app in Meta Developers for testing
3. **Environment Variables**: Keep `.env` files out of version control
4. **Database Backups**: Regular backups recommended for production
5. **API Keys**: Rotate keys regularly and use strong secrets

## 🚀 Deploy to Production

Once you're ready to deploy:

1. See [POST_IMPLEMENTATION_CHECKLIST.md](./POST_IMPLEMENTATION_CHECKLIST.md)
2. Complete all security and configuration steps
3. Deploy to your chosen platform
4. Monitor logs and health checks
5. Set up alerts and monitoring

---

**Need help?** Check [/docs/guides/](./docs/guides/) for detailed guides and troubleshooting.
