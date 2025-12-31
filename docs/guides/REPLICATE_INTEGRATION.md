# Media Generation Integration

## Overview

The AI Freedom Studios platform supports **flexible media generation** with provider selection for images and videos. Choose between Replicate and Poe based on your needs.

## Provider Options

### Video Generation
1. **Poe Video-Generator-PRO** (Recommended)
   - Direct OpenAI-compatible API
   - No polling required
   - Faster response times
   - Model: `Video-Generator-PRO`

2. **Replicate Zeroscope**
   - High-quality text-to-video
   - Requires polling for completion
   - Model: Zeroscope v2 XL
   - ~$0.05 per 15-second video

### Image Generation
1. **Replicate Flux Schnell** (Default)
   - Fast, high-quality images
   - Model: Flux Schnell by Black Forest Labs
   - ~$0.003 per image

## Architecture

### Components Updated

1. **ReplicateClient** (`api/src/engines/replicate.client.ts`)
   - Handles all image generation via Flux Schnell
   - Handles all video generation via Zeroscope
   - Proper error handling with user-friendly messages
   - No mock fallbacks - real generation only

2. **CreativesService** (`api/src/creatives/creatives.service.ts`)
   - `generateActualImage()` - Uses Replicate for images
   - `generateActualVideo()` - Uses Replicate for videos
   - Downloads generated media and uploads to R2
   - Retry logic with exponential backoff for reliable downloads

3. **PoeClient** (`api/src/engines/poe.client.ts`)
   - Text generation ONLY (captions, prompts, scripts)
   - Image/video generation methods throw errors
   - Removed all mock generation code

## Configuration

### Required Environment Variables

```env
# Poe API (text/chat and video generation)
POE_API_KEY=your_poe_api_key_here
POE_API_URL=https://api.poe.com/v1

# Replicate API Key (for image generation and optional video)
# Get your API key at: https://replicate.com/account/api-tokens
# Add credits at: https://replicate.com/account/billing
REPLICATE_API_KEY=your_replicate_api_key_here

# Media generation provider selection
# VIDEO_PROVIDER: 'poe' (uses Video-Generator-PRO) or 'replicate' (uses Zeroscope)
# IMAGE_PROVIDER: 'replicate' (uses Flux Schnell) or 'poe' (experimental)
VIDEO_PROVIDER=poe
IMAGE_PROVIDER=replicate
```

### Provider Selection

**VIDEO_PROVIDER=poe** (Recommended)
- Uses Poe's Video-Generator-PRO model
- Faster generation (no polling)
- Simpler error handling
- Included in Poe API costs

**VIDEO_PROVIDER=replicate**
- Uses Zeroscope v2 XL model
- Higher quality options
- Per-second billing
- Requires Replicate credits

**IMAGE_PROVIDER=replicate** (Default)
- Uses Flux Schnell model
- Fast, high-quality images
- Cost-effective (~$0.003/image)

**IMAGE_PROVIDER=poe** (Experimental)
- Not fully implemented
- Falls back to Replicate

### Models Used

**Images:**
- Provider: Replicate
- Model: Flux Schnell (black-forest-labs)
- Version: `5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637`
- Features: Fast, high-quality image generation
- Default size: 1024x1024
- Cost: ~$0.003 per image

**Videos (Poe):**
- Provider: Poe
- Model: Video-Generator-PRO
- Features: Direct API, no polling, fast generation
- Default: 15 seconds
- Cost: Included in Poe API usage

**Videos (Replicate Alternative):**
- Provider: Replicate
- Model: Zeroscope v2 XL
- Version: `9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351`
- Features: Text-to-video generation
- Default: 15 seconds at 24fps
- Cost: ~$0.05 per 15-second video

## Error Handling

### Payment Required (402)
When Replicate returns a 402 status:
```
Error: Replicate account has insufficient credits. 
Please add credits at https://replicate.com/account/billing
```

### Missing API Key
```
Error: Replicate API key is required for image/video generation. 
Please configure REPLICATE_API_KEY in your environment.
```

### Generation Timeout
Videos have a 2-minute timeout. If exceeded:
```
Error: Prediction timeout - generation took too long
```

## Flow

### Image Generation Flow

1. User triggers render for image creative
2. `CreativesService.generateActualImage()` called
3. ReplicateClient creates prediction
4. Polls Replicate API until complete (exponential backoff)
5. Downloads image from Replicate URL
6. Uploads to Cloudflare R2
7. Updates creative with R2 URL
8. Attaches asset to campaign

### Video Generation Flow

#### Using Poe (VIDEO_PROVIDER=poe)
1. User triggers render for video creative
2. `CreativesService.generateActualVideo()` called
3. PoeClient calls Video-Generator-PRO with prompt
4. Response received directly (no polling)
5. Downloads video from Poe URL
6. Uploads to Cloudflare R2 with retry logic (3 attempts)
7. Updates creative with R2 URL
8. Attaches asset to campaign

#### Using Replicate (VIDEO_PROVIDER=replicate)
1. User triggers render for video creative
2. `CreativesService.generateActualVideo()` called
3. ReplicateClient creates prediction with 15-second duration
4. Polls Replicate API (up to 2 minutes)
5. Downloads video with retry logic (3 attempts, exponential backoff)
6. Uploads to Cloudflare R2
7. Updates creative with R2 URL
8. Attaches asset to campaign

## Retry Logic

### Download Retries
- Max attempts: 3
- Backoff: 1s, 2s, 4s
- Timeout per attempt: 30 seconds
- Applied to both images and videos

### Prediction Polling
- Exponential backoff: starts at 1s, max 5s
- Image timeout: 60 seconds
- Video timeout: 120 seconds

## Costs

### Replicate Pricing
- Charges per second of GPU time
- Flux Schnell: ~$0.003/image
- Zeroscope: ~$0.05/15-second video

### Best Practices
1. Monitor credit balance regularly
2. Set up billing alerts in Replicate dashboard
3. Consider rate limiting for production
4. Cache generated assets in R2 to avoid regeneration

## Removed Features

### Mock Generation
- ❌ `USE_MOCK_MEDIA_GENERATION` flag removed
- ❌ `USE_REPLICATE_FOR_VIDEO` flag removed
- ❌ Mock URL fallbacks removed
- ❌ Development bypass removed

**Rationale:** Mock URLs were unreliable, causing fetch failures and confusing error states. Production systems require real generation.

## Testing

### Prerequisites
1. Valid `REPLICATE_API_KEY` in `.env`
2. Sufficient credits in Replicate account
3. Valid JWT token for API authentication

### Test Image Generation
```bash
POST /api/creatives/generate/image
{
  "tenantId": "your_tenant_id",
  "campaignId": "your_campaign_id",
  "model": "gpt-4o",
  "prompt": "A serene mountain landscape at sunset",
  "generateActual": true
}
```

### Test Video Generation
```bash
POST /api/creatives/generate/video
{
  "tenantId": "your_tenant_id",
  "campaignId": "your_campaign_id",
  "model": "gpt-4o",
  "prompt": "A cinematic product reveal",
  "generateActual": true
}
```

### Expected Logs
```
[CreativesService]: [generateActualImage] Using Replicate for image generation
[ReplicateClient] Generating image
[ReplicateClient] Image generated successfully
[CreativesService]: [generateActualImage] Downloading image from https://...
[CreativesService]: [generateActualImage] Image uploaded to R2: https://...
```

## Troubleshooting

### Issue: 402 Payment Required
**Solution:** Add credits at https://replicate.com/account/billing

### Issue: Fetch Failed
**Cause:** Network timeout or invalid URL
**Solution:** Check retry logic logs; may need to increase timeout

### Issue: R2 Upload Failed
**Cause:** Invalid R2 credentials
**Solution:** Verify R2 configuration in `.env` and admin panel

### Issue: Prediction Not Found (404)
**Cause:** Invalid prediction ID or expired
**Solution:** Check Replicate API status; may need to regenerate

## Migration Notes

### From Previous Implementation
If migrating from Poe-only or mock generation:

1. **Remove obsolete env vars:**
   - `USE_MOCK_MEDIA_GENERATION`
   - `USE_REPLICATE_FOR_VIDEO`

2. **Update API key:**
   - Ensure `REPLICATE_API_KEY` is set

3. **Add Replicate credits:**
   - Visit https://replicate.com/account/billing
   - Recommended starting balance: $10-$20

4. **Test thoroughly:**
   - Generate test image
   - Generate test video
   - Verify R2 uploads
   - Check asset references

## Future Enhancements

### Potential Improvements
- [ ] Support alternative models (Stable Diffusion, Runway Gen2)
- [ ] Model selection UI in frontend
- [ ] Cost tracking per campaign
- [ ] Batch generation for multiple assets
- [ ] Queue system for high-volume generation
- [ ] Webhook support for async generation
- [ ] Custom model version overrides

### Provider Pluggability
The architecture supports adding additional providers:
- Midjourney API (when available)
- OpenAI DALL-E 3
- Stability AI
- Runway ML

Implementation would require:
1. New client class (e.g., `MidjourneyClient`)
2. Add to `EnginesModule` providers
3. Update `CreativesService` with provider selection logic
4. Add provider-specific env configuration

## Support

For Replicate-specific issues:
- Documentation: https://replicate.com/docs
- Support: support@replicate.com
- Status: https://status.replicate.com

For AI Freedom Studios issues:
- Check logs in `logs/replicate-client.log`
- Review error messages in API response
- Contact development team
