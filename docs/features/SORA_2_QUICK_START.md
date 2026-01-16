# Quick Start: Sora 2 Video Generation

## 30-Second Summary

**What**: Generate professional videos with OpenAI Sora 2 Pro, including support for brand logo/reference images  
**Where**: Campaign Asset Generation → "Generate Videos" button  
**Result**: Video added to creatives, ready for publishing

---

## For Users

### Generate Your First Video

1. **Start Campaign → Asset Generation Step**
2. **Click "🎬 Generate Videos"**
3. **Enter video prompt**: *"Animated product demo with dramatic lighting"*
4. **Add reference image** (optional): Brand logo or style reference
5. **Click "🎬 Generate Video"** and wait 2-5 minutes
6. **Preview** and **Download** or add to creatives

### Tips

- 💡 **Detailed prompts = Better videos** (mention style, lighting, mood, movement)
- 🖼️ **Reference images help consistency** (especially for brand elements)
- ⏱️ **Duration matters** (5-60 seconds: shorter = faster, longer = more cinematic)
- 🎯 **Use refinement hints** for AI to optimize your prompt

---

## For Developers

### Key Files

```
api/src/
├── engines/replicate.client.ts          # Replicate API integration
├── video/
│   ├── video-generation.service.ts      # Business logic
│   ├── video-generation.controller.ts   # HTTP endpoints
│   ├── video-generation.dto.ts         # DTOs
│   └── video-generation.module.ts      # Module config

frontend/app/app/campaigns/components/
├── VideoGenerationWithReferences.tsx     # React component
└── CampaignChatBot.tsx                 # Integration point
```

### API Endpoints

```bash
# Generate video
POST /api/video/generate
{
  "prompt": "string",
  "model": "sora-2-pro" (default),
  "duration": 6 (seconds),
  "referenceImageUrls": ["url1", "url2"],
  "refinementPrompt": "optional context"
}

# List available models
GET /api/video/models

# Examples (pre-configured)
POST /api/video/examples/brand-animation
POST /api/video/examples/product-showcase
POST /api/video/examples/social-media
```

### Quick Implementation

**Add video generation to any component**:
```tsx
import VideoGenerationWithReferences from '@/app/campaigns/components/VideoGenerationWithReferences';

<VideoGenerationWithReferences 
  campaignId={campaignId}
  onVideoGenerated={(result) => {
    console.log('Video URL:', result.videoUrl);
    // Add to database, display, etc.
  }}
/>
```

**Call API directly**:
```typescript
const response = await fetch('/api/video/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Professional product video',
    model: 'sora-2-pro',
    duration: 8,
    referenceImageUrls: ['https://company.com/logo.png']
  })
});

const video = await response.json();
console.log(video.videoUrl); // Ready to use!
```

---

## Environment Setup

### Backend Requirements

```env
# .env file
REPLICATE_API_KEY=your_key_here
POE_API_KEY=your_key_here
R2_BUCKET_NAME=your_bucket
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
```

### Install & Run

```bash
# Backend
cd api
npm install
npm run start

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Model Comparison

| Model | Speed | Quality | Refs | Duration | Use Case |
|-------|-------|---------|------|----------|----------|
| **Sora 2** | 2-5m | ⭐⭐⭐⭐⭐ | ✅ | 5-60s | **Premium** |
| Veo 3.1 | 1-2m | ⭐⭐⭐⭐ | ✅ | 4-8s | High-quality |
| Runway Gen-3 | 2-3m | ⭐⭐⭐⭐ | ❌ | 4-60s | Reliable |
| Runway Gen-2 | 1-2m | ⭐⭐⭐ | ❌ | 4-60s | Budget |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key invalid" | Check REPLICATE_API_KEY in .env |
| "Reference image won't upload" | Verify R2 credentials and bucket permissions |
| "Video takes too long" | Normal for Sora 2 (2-5 min). Try Veo 3.1 for faster results |
| "Model not found" | Run `GET /api/video/models` to verify |
| "Reference images don't help" | Use high-quality images (512x512+) and clear prompts |

---

## Testing

```bash
# Backend tests
cd api && npm run test

# Backend health check
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3001/api/video/models

# Generate test video
curl -X POST http://localhost:3001/api/video/generate \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional product demo",
    "duration": 5
  }'
```

---

## Documentation

- 📚 **Full Integration Guide**: `docs/features/SORA_2_VIDEO_GENERATION_INTEGRATION.md`
- ✅ **Implementation Checklist**: `docs/features/SORA_2_VIDEO_GENERATION_CHECKLIST.md`
- 🎯 **This Quick Start**: `docs/features/SORA_2_QUICK_START.md`

---

## Next Steps

✅ **Done**: Core implementation complete  
🔄 **Next**: Write tests, deploy to staging, get user feedback  
🚀 **Then**: Monitor metrics, optimize, plan Phase 2 enhancements

---

## Key Concepts

### 5-Step Workflow
1. **Prompt Refinement** (optional AI enhancement)
2. **Reference Image Upload** (to R2 storage)
3. **Video Generation** (call Replicate API)
4. **Response Parsing** (extract video URL)
5. **Permanent Storage** (upload generated video to R2)

### Reference Images
- URLs passed directly to Replicate
- Files uploaded to R2 first
- Support for multiple images
- Improve visual consistency

### Model Selection
- Default: Sora 2 Pro (best quality)
- Users can override per video
- Model selection persisted in metadata
- Capabilities exposed via API

---

## Performance

**Typical Times**:
- Sora 2 Pro: 2-5 minutes (5-60 seconds video)
- Veo 3.1: 1-2 minutes (4-8 seconds video)
- Reference image upload: < 1 second
- Prompt refinement: 5-10 seconds

**Costs**:
- Billed by Replicate per API call
- Reference images free
- R2 storage: ~$0.015 per GB/month
- Prompt refinement: ~$0.01 per request

---

## Support

**Issues?**
1. Check logs: `tail -f logs/api.log | grep VideoGeneration`
2. Test endpoint: `GET /api/video/models`
3. Review: `docs/features/SORA_2_VIDEO_GENERATION_INTEGRATION.md`
4. Contact: engineering@aifreedomstudios.com

---

**Last Updated**: January 2025  
Version: 1.0.0
