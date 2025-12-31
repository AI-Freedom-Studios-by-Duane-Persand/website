# Poe Video-Generator-PRO Integration - Quick Start

## What Changed

Added support for **Poe's Video-Generator-PRO** model as the primary video generation provider, offering faster and simpler video generation compared to Replicate.

## Configuration

### Environment Variables
```env
# Set video provider to use Poe
VIDEO_PROVIDER=poe

# Poe API credentials
POE_API_KEY=your_poe_api_key_here
POE_API_URL=https://api.poe.com/v1
```

### Provider Options
- `VIDEO_PROVIDER=poe` - Uses Poe Video-Generator-PRO (recommended)
- `VIDEO_PROVIDER=replicate` - Uses Replicate Zeroscope (alternative)

## Usage Example

### Python SDK Style (Reference)
```python
import openai

client = openai.OpenAI(
    api_key="YOUR_POE_API_KEY",
    base_url="https://api.poe.com/v1",
)

chat = client.chat.completions.create(
    model="Video-Generator-PRO",
    messages=[{
        "role": "user", 
        "content": "A cinematic drone shot over a neon city at night"
    }],
)
```

### API Request
```bash
POST /api/creatives/generate/video
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "tenantId": "your_tenant_id",
  "campaignId": "your_campaign_id",
  "model": "gpt-4o",
  "prompt": "A cinematic drone shot over a neon city at night",
  "generateActual": true
}
```

## Flow

1. **Script Generation** (Poe GPT-4o)
   - Generates video script from prompt
   - Creates structured content

2. **Video Generation** (Poe Video-Generator-PRO)
   - Takes script + prompt
   - Generates video directly
   - Returns video URL

3. **Storage** (Cloudflare R2)
   - Downloads video from Poe URL
   - Uploads to R2 with retry logic
   - Updates creative with R2 URL

## Benefits of Poe Video-Generator-PRO

✅ **Faster**: No polling required - direct response
✅ **Simpler**: Single API call vs prediction polling
✅ **Reliable**: Built-in error handling
✅ **Cost-effective**: Included in Poe API usage
✅ **OpenAI-compatible**: Standard chat completions format

## Expected Logs

```
[CreativesService]: [generateActualVideo] Starting video generation
[CreativesService]: [generateActualVideo] Using poe for video generation
[PoeClient] Generating content for engine: video-generation
[generateVideo] Generating video with Poe
[generateVideo] Using model: Video-Generator-PRO
[generateVideo] Video generation response received
[generateVideo] Video URL extracted
[CreativesService]: [generateActualVideo] Downloading video from https://...
[CreativesService]: [generateActualVideo] Video uploaded to R2: https://...
```

## Testing

### Start Server
```powershell
cd "c:\Users\786\Desktop\Projects\AI Freedom Studios\api"
npm run start:dev
```

### Test Video Generation
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}

$body = @{
    tenantId = "your_tenant_id"
    campaignId = "your_campaign_id"
    model = "gpt-4o"
    prompt = "A cinematic drone shot over a neon city at night"
    generateActual = $true
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://localhost:3001/api/creatives/generate/video" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

## Error Handling

### Poe API Errors
- **Invalid API Key**: Check `POE_API_KEY` in `.env`
- **Model Not Found**: Ensure "Video-Generator-PRO" is available
- **No URL in Response**: Check response format and parsing logic

### Fallback to Replicate
If Poe fails, you can switch providers:
```env
VIDEO_PROVIDER=replicate
```

Requires:
- Valid `REPLICATE_API_KEY`
- Sufficient Replicate credits

## Architecture

```
User Request
    ↓
CreativesService
    ↓
Provider Selection (VIDEO_PROVIDER env)
    ↓
┌─────────────────┬──────────────────┐
│   Poe Client    │ Replicate Client │
│ Video-Gen-PRO   │   Zeroscope      │
└─────────────────┴──────────────────┘
    ↓
Download Video
    ↓
Upload to R2
    ↓
Update Creative
```

## Migration Guide

### From Replicate-Only

1. **Update .env**
   ```env
   VIDEO_PROVIDER=poe
   POE_API_KEY=your_poe_key
   ```

2. **Rebuild**
   ```powershell
   npm run build
   ```

3. **Test**
   - Generate a test video
   - Verify Poe is used in logs
   - Check R2 upload succeeds

### Rollback to Replicate
```env
VIDEO_PROVIDER=replicate
```

No code changes needed - just toggle the env var.

## Cost Comparison

| Provider | Model | Cost per 15s Video | Notes |
|----------|-------|-------------------|-------|
| Poe | Video-Generator-PRO | Included in API usage | Faster, simpler |
| Replicate | Zeroscope | ~$0.05 | Pay per second GPU time |

## Next Steps

- [ ] Test video generation with Poe
- [ ] Monitor response times vs Replicate
- [ ] Implement video quality comparison
- [ ] Add provider selection to UI
- [ ] Track costs per provider
