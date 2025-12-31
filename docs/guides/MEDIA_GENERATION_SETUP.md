# Media Generation Configuration Guide

## Overview

The AI Freedom Studios platform supports both **mock** and **real** image/video generation with a simple environment variable toggle.

## Current Setup

### POE API (Text Generation Only)
- **Purpose**: Chat completions, text generation, captions, scripts
- **API Key**: Configured in `.env` as `POE_API_KEY`
- **Endpoint**: `https://api.poe.com/v1`
- **Note**: POE API does NOT support direct image/video generation endpoints

### Poe-Only Mode (Image/Video)
- **Purpose**: Use Poe for text/chat; return mock image/video URLs for development
- **Note**: Poe API does not provide direct REST endpoints for image/video generation

## Configuration Options

### Option 1: Mock URLs (Development) - **CURRENT**

**Configuration:**
```env
USE_MOCK_MEDIA_GENERATION=true
SKIP_SUBSCRIPTION_CHECK=true
```

**Behavior:**
- ✅ Fast development/testing without API costs
- ✅ Returns mock image URLs from picsum.photos
- ✅ Returns mock video URLs
- ✅ Complete campaign flow testing
- ⚠️ No actual media generated

**Use Case:**
- Development and testing
- UI/UX flow validation
- Database schema verification
- Campaign workflow testing

### Option 2: Poe-Only (Production)

**Configuration:**
```env
USE_MOCK_MEDIA_GENERATION=false
SKIP_SUBSCRIPTION_CHECK=false
```

**Behavior:**
- ✅ Actual image generation via Flux Schnell
- ✅ Actual video generation via Zeroscope
- ✅ High-quality professional output
- ⚠️ Costs per generation (see Replicate pricing)

**Use Case:**
- Production environment
- Client demos with real output
- Full feature testing

## Supported Models

### Text/Multimodal Understanding (via Poe)
- GPT-4o, GPT-4, GPT-3.5-turbo
- Claude 3 (opus/sonnet/haiku)
- Gemini 1.5 Pro

## Setup Instructions

### 1. For Development (Mock URLs)
```bash
# In api/.env
USE_REAL_MEDIA_GENERATION=false
SKIP_SUBSCRIPTION_CHECK=true

# Rebuild and restart
npm run build
npm run start:dev
```

### 2. For Production (Poe-Only)

Ensure env:
```bash
# In api/.env
USE_MOCK_MEDIA_GENERATION=false
SKIP_SUBSCRIPTION_CHECK=false

# Rebuild and restart
npm run build
npm run start:dev
```

## API Response Format

### Mock Response (Development)
```json
{
  "url": "https://picsum.photos/1024/1024?random=abc123",
  "prompt": "Your prompt here",
  "mock": true,
  "message": "Mock image - set USE_REAL_MEDIA_GENERATION=true for real generation"
}
```

### Real Response (Production)
In Poe-only mode, media responses are either mock or derived via chat completions that include URLs.

## Cost Estimation

### Development (Mock URLs)
- **Cost**: $0
- **Unlimited generations**
- **Instant response**

### Production (Poe-Only)
No direct media-generation costs in this mode. Text/chat usage follows Poe platform constraints.

## Troubleshooting

### Issue: "Mock video/image URL" in production
**Solution:** Set `USE_MOCK_MEDIA_GENERATION=false` to disable forced mocks.

### Issue: "Prediction timeout"
**Solution:** Video generation takes 60-120s, ensure client timeout is sufficient

### Issue: "No API key configured"
**Solution:** Check `.env` file has `REPLICATE_API_KEY=r8_...` with valid token

### Issue: 404 from Replicate
**Solution:** Check API key is valid and has credits available

## Future Providers (Optional)
If you decide to add real media generation later, the architecture supports pluggable engines (e.g., Stability AI, OpenAI DALL-E, RunwayML).

## Implementation Details

### File Structure
```
api/src/engines/
├── poe.client.ts           # POE API for text/chat
├── (pluggable) media client   # Placeholder for future providers
├── engines.module.ts       # Module configuration
└── engines.service.ts      # Business logic
```

### Key Environment Variables
| Variable | Purpose | Required |
|----------|---------|----------|
| `POE_API_KEY` | Text generation | Yes |
| `USE_MOCK_MEDIA_GENERATION` | Force mock URLs | No (default: true) |
| `SKIP_SUBSCRIPTION_CHECK` | Bypass auth in dev | No (default: false) |

## Next Steps

1. ✅ Test mock URLs work (current setup)
2. ⚠️ Decide if/when to add real media generation
3. ⚠️ Test flows end-to-end with Poe-only setup
4. ⚠️ Implement asset caching to reduce costs
5. ⚠️ Add usage monitoring and alerts
6. ⚠️ Enable subscription gates before public launch

## Support

- **POE Docs**: https://creator.poe.com/docs
- **Issue Tracker**: Check GitHub issues for known problems

## Status

- ✅ Mock generation working (development)
- ✅ Replicate integration implemented
- ⚠️ Real generation pending API key
- ⚠️ Production deployment pending
