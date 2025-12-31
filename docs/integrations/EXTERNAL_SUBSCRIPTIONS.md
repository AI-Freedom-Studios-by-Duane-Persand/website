# External Subscriptions & Services Required

This document outlines all external services and subscriptions required by the AI Freedom Studios platform.

---

## 1. AI & Content Generation

### 1.1 Poe API (Required)
**Purpose**: Text, image, and video generation through unified API interface  
**Service**: Poe.com  
**URL**: https://poe.com/api_key  
**Pricing**: Pay-as-you-go credit system

#### Configuration
```dotenv
POE_API_URL=https://api.poe.com/v1
POE_API_KEY=<your_poe_api_key_here>

# Model selection (optional, has defaults)
POE_IMAGE_MODEL=dall-e-3                    # Default image model
POE_VIDEO_MODEL=veo-3                       # Default video model
POE_TEXT_MODEL=gpt-4o                       # Default text model
```

#### Implementation Details
- **Location**: `api/src/engines/poe.client.ts`
- **Usage**: Used by `StrategyEngine`, `CopyEngine`, and `CreativesService`
- **Models Available**:
  - **Text**: GPT-4o, Claude-3 series, Gemini-1.5-pro
  - **Image**: DALL-E-3, Stable Diffusion XL
  - **Video**: Veo-3, Gemini-1.5-pro, Video-Generator-PRO
- **Features**:
  - Connection pooling (max 10 concurrent)
  - Automatic quota handling
  - Fallback content generation on API errors
  - Model capability mapping for proper routing
- **Error Handling**: 
  - Graceful fallback when credits exhausted
  - Detailed logging with Winston
  - Model-specific error messages

#### Integration Points
- Campaign strategy generation
- Copy/caption generation
- Creative content creation (text-based)
- Supports selective regeneration

---

### 1.2 Replicate API (Required)
**Purpose**: Image and video generation with specialized models  
**Service**: Replicate.com  
**URL**: https://replicate.com  
**Pricing**: Per-second billing for compute

#### Configuration
```dotenv
REPLICATE_API_KEY=<your_replicate_api_key>
```

#### Implementation Details
- **Location**: `api/src/engines/replicate.client.ts`
- **Usage**: Dedicated image/video generation (per plan requirements)
- **Supported Models**:
  - **Image**: Flux-schnell, SDXL
  - **Video**: Runway Gen-2, Zeroscope v2
- **Features**:
  - Async webhook-based processing (10+ min videos)
  - Real-time job polling
  - Timeout handling (120 second default)
  - Direct URL resolution for outputs

#### Integration Points
- `CreativesService.generateActualImage()`
- `CreativesService.generateActualVideo()`
- Always used for image/video (per architecture plan)
- Supports multi-hour video generation with webhooks

---

## 2. Payment & Billing

### 2.1 Stripe (Required for Payments)
**Purpose**: Subscription billing, payment processing, and checkout  
**Service**: Stripe.com  
**URL**: https://stripe.com  
**Pricing**: 2.9% + $0.30 per transaction

#### Configuration
```dotenv
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>
STRIPE_PRICE_ID=<price_id_for_subscription>
STRIPE_SUCCESS_URL=https://yourdomain.com/success
STRIPE_CANCEL_URL=https://yourdomain.com/cancel
```

#### Implementation Details
- **Locations**:
  - `api/src/services/stripe.service.ts` - Core integration
  - `api/src/billing/billing.controller.ts` - Billing endpoints
  - `api/src/subscriptions/subscriptionsV2.controller.ts` - Subscription checkout
- **Features**:
  - Checkout session creation
  - Subscription management
  - Webhook event handling (payment intent, checkout session)
  - Customer ID tracking (stored in tenant schema)
  - Payment link generation

#### Database Integration
- **Tenant Schema**: `stripeCustomerId` field for customer tracking
- **Subscription Schema**: `lastStripePaymentId` field for payment audit trail

#### API Endpoints
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/webhook` - Handle Stripe webhooks
- `GET /api/billing/verify/:sessionId` - Verify checkout completion
- `POST /api/subscriptions/checkout` - SubscriptionV2 checkout
- `POST /api/subscriptions/webhook` - Subscription webhooks

#### Subscription Plans
Three tiers defined in `api/src/config/plans.ts`:
- **Starter**: $29/month (3 campaigns, 30 posts/month, 3 users)
- **Pro**: $99/month (10 campaigns, 100 posts/month, 10 users)
- **Agency**: $299/month (50 campaigns, 500 posts/month, 50 users)

---

## 3. Cloud Storage

### 3.1 Cloudflare R2 (Required for Asset Storage)
**Purpose**: S3-compatible object storage for campaigns assets, uploads, and generated media  
**Service**: Cloudflare (R2)  
**URL**: https://www.cloudflare.com/products/r2/  
**Pricing**: $0.015/GB stored + $0.20/1M requests

#### Configuration
```dotenv
R2_ACCOUNT_ID=<your_cloudflare_account_id>
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret_key>
R2_BUCKET_NAME=ai-freedom-assets
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com

# Alternative endpoint format
R2_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=ai-freedom-assets
R2_REGION=auto
```

#### Implementation Details
- **Locations**:
  - `api/src/services/storage.service.ts` - Core S3 operations
  - `api/src/integrations/r2-config-seed.service.ts` - Configuration management
  - `api/src/assets/assets.controller.ts` - Asset endpoints
- **Features**:
  - S3-compatible API (AWS SDK)
  - PUT/GET/DELETE operations
  - Signed URL generation for secure asset sharing
  - Asset tagging and categorization
  - Multi-part upload support for large files

#### Database Entities
- Asset Library schema in MongoDB
- Asset metadata (URL, size, type, campaign association)
- Cross-campaign asset reuse support

#### API Endpoints
- `POST /api/assets/upload` - Upload asset to R2
- `GET /api/assets/:id` - Retrieve asset metadata
- `DELETE /api/assets/:id` - Delete asset
- `POST /api/assets/public-url` - Generate signed public URL

#### Bucket Structure
```
ai-freedom-assets/
├── campaigns/
│   └── {campaignId}/
│       ├── user-uploads/
│       └── generated-media/
├── library/
│   ├── images/
│   └── videos/
└── temp/
    └── processing/
```

---

## 4. Social Media Publishing

### 4.1 Ayrshare API (Required for Social Publishing)
**Purpose**: Unified social media publishing across multiple platforms  
**Service**: Ayrshare.com  
**URL**: https://ayrshare.com  
**Pricing**: Varies by platform package

#### Configuration
```dotenv
AYRSHARE_API_KEY=<your_ayrshare_api_key>
```

#### Implementation Details
- **Locations**:
  - `api/src/social/ayrshare.service.ts` - API client
  - `api/src/scheduling/scheduling.service.ts` - Publishing orchestration
  - `api/src/social/social-publisher.ts` - Publisher abstraction
- **Supported Platforms**:
  - Twitter/X
  - Facebook/Instagram (organic)
  - LinkedIn
  - TikTok
  - YouTube
  - Pinterest

#### Features
- Scheduled posting (future dates)
- Multi-platform campaigns
- Media upload and attachment
- URL shortening
- Post analytics and history
- Profile management
- JWT-based authentication

#### API Operations
- `createPost()` - Publish content across platforms
- `getProfiles()` - List connected social accounts
- `getHistory()` - Retrieve post history
- `getPostAnalytics()` - Performance metrics per post
- `getAccountAnalytics()` - Overall account metrics
- `deletePost()` - Remove published content
- `uploadMedia()` - Upload media for posts
- `shortenUrl()` - URL shortening service
- `checkConnection()` - Verify platform connectivity
- `generateJWT()` - Domain-specific authentication

#### Integration Points
- Scheduling service for automated posting
- Social accounts controller for profile management
- Creative/campaign content publishing

---

### 4.2 Meta Ads API (Optional - Future)
**Purpose**: Facebook/Instagram paid advertising campaigns  
**Service**: Meta/Facebook Business Suite  
**URL**: https://developers.facebook.com/docs/marketing-apis  
**Pricing**: Ad spend dependent

#### Configuration
```dotenv
META_ADS_ACCESS_TOKEN=<your_meta_access_token>
```

#### Implementation Details
- **Location**: `api/src/meta-ads/meta-ads.service.ts`
- **Status**: Stub implementation in place
- **Planned Features**:
  - Campaign creation/management
  - Budget allocation
  - Audience targeting
  - Performance reporting

---

## 5. Database & Infrastructure

### 5.1 MongoDB (Self-Hosted or Atlas)
**Purpose**: Primary application database  
**Service**: MongoDB Inc. / Self-hosted  
**Pricing**: Atlas free tier or self-hosted cost

#### Configuration
```dotenv
MONGODB_URI=mongodb://localhost:27017/ai-freedom-studios
MONGODB_DB_NAME=ai-freedom-studios
```

#### Collections
- Users
- Campaigns
- Creatives
- Assets
- Strategies
- Subscriptions
- Tenants
- Social Accounts
- Approvals/Workflow states

---

## 6. Application Configuration

### 6.1 Environment Variables Summary
```dotenv
# AI Generation (Poe + Replicate)
POE_API_URL=https://api.poe.com/v1
POE_API_KEY=<required>
POE_IMAGE_MODEL=dall-e-3
POE_VIDEO_MODEL=veo-3
POE_TEXT_MODEL=gpt-4o
REPLICATE_API_KEY=<required>

# Cloud Storage (R2)
R2_ACCOUNT_ID=<required>
R2_ACCESS_KEY_ID=<required>
R2_SECRET_ACCESS_KEY=<required>
R2_BUCKET_NAME=ai-freedom-assets
R2_PUBLIC_URL=<required>

# Database
MONGODB_URI=<required>
MONGODB_DB_NAME=ai-freedom-studios

# Authentication
JWT_SECRET=<required>
JWT_EXPIRES_IN=7d

# Payment Processing
STRIPE_SECRET_KEY=<required>
STRIPE_WEBHOOK_SECRET=<required>
STRIPE_PRICE_ID=<required>
STRIPE_SUCCESS_URL=<required>
STRIPE_CANCEL_URL=<required>

# Social Publishing
AYRSHARE_API_KEY=<required>

# Optional Services
META_ADS_ACCESS_TOKEN=<optional>

# Application
PORT=3001
NODE_ENV=development|production
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

---

## 7. Setup Checklist

### Before Going Live
- [ ] Create Poe API account and get API key
- [ ] Create Replicate API account and get API key
- [ ] Set up Stripe account with billing plans
- [ ] Configure Stripe webhook endpoints
- [ ] Create Cloudflare account and set up R2 bucket
- [ ] Create Ayrshare account and connect social platforms
- [ ] Set up MongoDB (Atlas or self-hosted)
- [ ] Generate JWT secret
- [ ] Configure CORS origins for production domain
- [ ] Set up email whitelisting for early access (in `api/src/auth/early-access.config.ts`)

### Verification Steps
```bash
# Test Poe API connection
curl -H "Authorization: Bearer YOUR_POE_KEY" \
  https://api.poe.com/v1/models

# Test Replicate API
curl -H "Token: YOUR_REPLICATE_KEY" \
  https://api.replicate.com/v1/account

# Test Stripe API
curl -H "Authorization: Bearer YOUR_STRIPE_KEY" \
  https://api.stripe.com/v1/customers

# Test R2 connection
aws s3 ls s3://ai-freedom-assets/ \
  --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com

# Test Ayrshare API
curl -H "Authorization: Bearer YOUR_AYRSHARE_KEY" \
  https://app.ayrshare.com/api/user
```

---

## 8. Cost Estimation

| Service | Tier | Cost | Usage |
|---------|------|------|-------|
| **Poe API** | Pay-as-you-go | Variable | Text/Image/Video generation |
| **Replicate** | Per-second | Variable | High-quality media |
| **Stripe** | Transaction | 2.9% + $0.30 | Payment processing |
| **Cloudflare R2** | Storage + requests | $0.015/GB + fees | Asset storage |
| **Ayrshare** | Platform packages | $20-100+/month | Social publishing |
| **MongoDB Atlas** | Shared/Dedicated | Free-$500+/month | Database |
| **Meta Ads** | Variable | Ad spend | Paid advertising (optional) |

**Estimated Monthly Cost**: $200-500+ (excluding ad spend)

---

## 9. Support & Documentation

| Service | Documentation | Support |
|---------|---------------|---------|
| Poe API | https://poe.com/api_key | poe.com/support |
| Replicate | https://replicate.com/docs | replicate.com/support |
| Stripe | https://stripe.com/docs | stripe.com/support |
| Cloudflare R2 | https://developers.cloudflare.com/r2/ | cloudflare.com/support |
| Ayrshare | https://docs.ayrshare.com | ayrshare.com/support |
| MongoDB | https://docs.mongodb.com | mongodb.com/support |

