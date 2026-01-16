# OpenAI Sora 2 Pro Video Generation Integration Guide

## Overview

This document describes the complete integration of OpenAI Sora 2 Pro video generation with **reference image and brand logo support** into the AI Freedom Studios campaign workflow.

**User Request**: "Use openai sora 2 for videos" + "Allow user to give reference image or brand logo"

**Status**: ✅ Fully Implemented

---

## Table of Contents

1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Integration](#frontend-integration)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### Component Diagram

```
Frontend (CampaignChatBot.tsx)
    ↓
VideoGenerationWithReferences Component
    ↓
POST /api/video/generate
    ↓
VideoGenerationController
    ↓
VideoGenerationService
    ├─ Step 1: Optional AI Prompt Refinement (PoeClient)
    ├─ Step 2: Upload Reference Images to R2 (StorageService)
    ├─ Step 3: Generate Video (ReplicateClient)
    ├─ Step 4: Parse Response
    └─ Step 5: Upload Generated Video to R2
    ↓
ReplicateClient
    ↓
Replicate API
    ↓
OpenAI Sora 2 Pro (+ Veo 3.1, Runway Gen-3, Gen-2 fallbacks)
```

### Supported Video Models

| Model | Duration | Reference Images | Quality | Use Case |
|-------|----------|------------------|---------|----------|
| **Sora 2 Pro** | 5-60s | ✅ Yes | Highest | Premium videos, brand animations |
| Veo 3.1 | 4-8s | ✅ Yes | High | Product demos, short clips |
| Runway Gen-3 | 4-60s | ❌ No | High | General videos |
| Runway Gen-2 | 4-60s | ❌ No | Good | Budget videos, testing |

---

## Backend Implementation

### 1. ReplicateClient Enhancement (`api/src/engines/replicate.client.ts`)

#### Updated Methods

**`listModelsByContentType('video')`**
- Returns array of video models with metadata
- Sora 2 Pro listed first (default selection)
- Models include: name, display name, type, duration range, reference image support

**`generateVideoWithModel(modelKey, prompt, options)`**
- Signature: `modelKey: 'sora-2-pro' | 'veo-3.1' | 'runway-gen3' | 'runway-gen2'`
- Routes Sora 2 Pro requests to dedicated `generateVideoWithSora2()` handler
- Supports optional reference images, duration, aspect ratio

**`generateVideoWithSora2(prompt, options)` (NEW)**
```typescript
private async generateVideoWithSora2(
  prompt: string, 
  options?: {
    duration?: number;           // 5-60 seconds (auto-adjusted)
    referenceImages?: string[];  // URLs to reference images
    aspectRatio?: '16:9' | '9:16' | '1:1';
  }
): Promise<VideoGenerationResponse>
```

**Key Features**:
- Duration validation: `Math.max(5, Math.min(60, requestedDuration))`
- Input building: `{ prompt, duration, image_input: referenceImages }`
- Output handling: Supports multiple formats (string, array, object.url())
- Returns: `{ url, prompt, durationSeconds, provider, model, referenceImagesCount }`
- Error handling: Specific error messages for common Sora 2 issues

### 2. VideoGenerationService (`api/src/video/video-generation.service.ts`)

**Core Responsibility**: High-level orchestration of the entire video generation workflow

#### Main Method: `generateVideoWithReferences(dto)`

```typescript
async generateVideoWithReferences(
  dto: GenerateVideoWithReferenceDto
): Promise<VideoGenerationResult>
```

**Workflow**:
1. **AI Prompt Refinement** (Optional)
   - If `dto.refinementPrompt` provided, use Poe API to optimize the prompt
   - Example: "Make it cinematic" → AI refines to professional cinematography prompt
   - Uses GPT-4o for highest quality refinement

2. **Reference Image Upload**
   - If reference images provided as Buffer objects, upload to R2 storage
   - URLs are passed directly (assumed already hosted)
   - Returns array of uploaded image URLs

3. **Video Generation**
   - Calls `ReplicateClient.generateVideoWithModel()`
   - Passes model selection, prompt, duration, reference images

4. **Response Parsing**
   - Extracts video URL from Replicate response
   - Handles multiple output formats

5. **Video Storage**
   - Uploads generated video to permanent R2 storage
   - Returns permanent R2 URL (not temporary Replicate URL)

**Returns**:
```typescript
{
  videoUrl: string;              // Permanent R2 URL
  videoPath: string;             // R2 object path
  prompt: string;                // Original prompt
  refinedPrompt?: string;        // AI-refined prompt if used
  model: string;                 // Model used (e.g., 'sora-2-pro')
  duration: number;              // Actual duration used
  referenceImages: Array<{       // Uploaded reference images
    url: string;
    uploadedAt: string;
  }>;
  metadata: {
    generatedAt: string;
    provider: string;            // 'replicate'
    resolution?: string;
  };
}
```

#### Helper Methods

**`uploadReferenceImages(buffers: Buffer[])`**
- Uploads image files to R2 storage
- Returns array of R2 URLs
- Used for file-based reference images (not URLs)

**`refineVideoPrompt(prompt, context)`**
- Uses Poe API (GPT-4o) to enhance video generation prompt
- Example inputs:
  - Original: "Product video"
  - Context: "Make it cinematic with dramatic lighting"
  - Output: "Professional cinematic product video with dramatic three-point lighting, slow camera pan, luxury aesthetic, 4K quality..."

**`getSupportedModels()`**
- Returns array of `VideoModelDto` with full capabilities
- Includes: name, description, duration range, reference image support, quality level

### 3. VideoGenerationController (`api/src/video/video-generation.controller.ts`)

**Base Route**: `/api/video`

#### Endpoints

**1. POST `/api/video/generate`**

Request:
```json
{
  "prompt": "Brand logo animation with motion graphics",
  "model": "sora-2-pro",
  "duration": 8,
  "referenceImageUrls": ["https://example.com/logo.png"],
  "refinementPrompt": "Make it cinematic with dramatic lighting"
}
```

Response (HTTP 202 Accepted for async processing):
```json
{
  "videoUrl": "https://r2.example.com/videos/generated/video-123.mp4",
  "videoPath": "videos/generated/video-123.mp4",
  "prompt": "Brand logo animation with motion graphics",
  "refinedPrompt": "Professional brand logo animation with dynamic motion graphics...",
  "model": "sora-2-pro",
  "duration": 8,
  "referenceImages": [
    {
      "url": "https://example.com/logo.png",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "metadata": {
    "generatedAt": "2024-01-15T10:31:45Z",
    "provider": "replicate",
    "resolution": "1080p"
  }
}
```

**2. GET `/api/video/models`**

Response:
```json
[
  {
    "key": "sora-2-pro",
    "name": "OpenAI Sora 2 Pro",
    "description": "Premium video generation with reference image support, 5-60 seconds",
    "durationRange": { "min": 5, "max": 60 },
    "supportsReferenceImages": true,
    "quality": "highest"
  },
  {
    "key": "veo-3.1",
    "name": "Google Veo 3.1",
    "description": "High-quality video generation, 4-8 seconds",
    "durationRange": { "min": 4, "max": 8 },
    "supportsReferenceImages": true,
    "quality": "high"
  },
  // ... more models
]
```

**3. Example Endpoints** (Pre-configured templates)

**POST `/api/video/examples/brand-animation`**
- Input: brandLogoUrl, productName, tagline
- Auto-generates cinematic brand animation prompt
- Automatically uses Sora 2 Pro for best results

**POST `/api/video/examples/product-showcase`**
- Input: productName, productDescription, referenceImageUrls
- Creates professional product showcase video
- Optimizes for e-commerce and social media

**POST `/api/video/examples/social-media`**
- Input: concept, platform (instagram|tiktok|youtube|facebook), brandImages
- Auto-optimizes for platform (aspect ratio, duration, style)
- Cuts video to platform-specific requirements

### 4. DTOs (`api/src/video/video-generation.dto.ts`)

```typescript
// Request DTO
class GenerateVideoWithReferenceDto {
  @IsString()
  prompt: string;  // Required

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(60)
  duration?: number;  // Validated per model

  @IsOptional()
  @IsEnum(['sora-2-pro', 'veo-3.1', 'runway-gen3', 'runway-gen2'])
  model?: string;  // Defaults to 'sora-2-pro'

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  referenceImageUrls?: string[];

  @IsOptional()
  @IsString()
  refinementPrompt?: string;  // Context for AI refinement

  @IsOptional()
  @IsEnum(['16:9', '9:16', '1:1'])
  aspectRatio?: string;
}

// Response DTO
class VideoGenerationResponseDto {
  videoUrl: string;
  videoPath: string;
  prompt: string;
  refinedPrompt?: string;
  model: string;
  duration: number;
  referenceImages: Array<{ url: string; uploadedAt: string }>;
  metadata: {
    generatedAt: string;
    provider: string;
    resolution?: string;
  };
}

// Model capabilities DTO
class VideoModelDto {
  key: string;
  name: string;
  description: string;
  durationRange: { min: number; max: number };
  supportsReferenceImages: boolean;
  quality: 'highest' | 'high' | 'good';
}
```

### 5. Module Registration (`api/src/video/video-generation.module.ts`)

```typescript
@Module({
  providers: [
    VideoGenerationService,
    ReplicateClient,
    StorageService,
    PoeClient,
  ],
  controllers: [VideoGenerationController],
  exports: [VideoGenerationService],
})
export class VideoGenerationModule {}
```

**Registered in**: `api/src/app.module.ts`

---

## Frontend Integration

### 1. VideoGenerationWithReferences Component

**Location**: `frontend/app/app/campaigns/components/VideoGenerationWithReferences.tsx`

**Features**:
- Video prompt textarea with smart placeholder
- Reference image management (add URLs or upload files)
- Model selector dropdown with capability indicators
- Duration slider (5-60 seconds, model-specific ranges)
- Advanced options panel (refinement instructions)
- Video preview player with download button
- Real-time error handling and loading states

**Props**:
```typescript
type Props = {
  campaignId?: string;
  onVideoGenerated?: (result: GenerationResult) => void;
};
```

**Key States**:
- `prompt`: Video description from user
- `selectedModel`: Selected video model (defaults to 'sora-2-pro')
- `duration`: Video length (5-60 seconds)
- `referenceImageUrls`: Array of reference image URLs
- `refinementPrompt`: Optional AI refinement context
- `generatedVideo`: Result object after generation
- `loading`: Generation in progress
- `error`: Error messages

**Lifecycle**:
1. Component mounts → Fetch available models from `/api/video/models`
2. User enters prompt
3. User adds reference images (URL or file upload)
4. User clicks "Generate Video"
5. Component calls POST `/api/video/generate`
6. Video appears in preview player
7. `onVideoGenerated` callback fires with result

### 2. CampaignChatBot Integration

**File**: `frontend/app/app/campaigns/components/CampaignChatBot.tsx`

**Changes**:
1. Import VideoGenerationWithReferences component
2. Add `showVideoGeneration` state to track UI visibility
3. Replace generic "🎬 Videos" button with toggle button
4. Render VideoGenerationWithReferences when toggle is active
5. Listen to `onVideoGenerated` callback to add videos to creatives list

**Integration Point** (Asset Generation Step):
```typescript
{showVideoGeneration && (
  <VideoGenerationWithReferences 
    campaignId={campaignId || undefined}
    onVideoGenerated={(result) => {
      // Create video creative object
      const newCreative = {
        _id: `video-${Date.now()}`,
        type: 'video',
        campaignId: campaignId,
        status: 'needsReview',
        visual: {
          prompt: result.prompt,
          url: result.videoUrl,
          refinedPrompt: result.refinedPrompt,
          model: result.model,
          duration: result.duration,
          referenceImages: result.referenceImages,
        },
        metadata: result.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Add to creatives list
      setCreatives((prev) => [...prev, newCreative]);
      // Show success message
      setMessages((prev) => [...prev, {
        sender: "system",
        message: `✅ Video generated and added to creatives! Model: ${result.model}, Duration: ${result.duration}s`,
        step: stepKey,
      }]);
    }}
  />
)}
```

### 3. Frontend Features

**Reference Image Management**:
- ✅ Add by URL (paste direct links to brand logos, style references)
- ✅ Upload files (drag-drop or file picker)
- ✅ Preview thumbnails of added images
- ✅ Remove individual images

**Model Selection**:
- ✅ Dropdown showing all 4 models
- ✅ Display quality rating (⭐ highest/high/good)
- ✅ Show duration range for each model
- ✅ Display whether model supports reference images

**Duration Control**:
- ✅ Range slider (model-specific min/max)
- ✅ Defaults to 6 seconds (good balance)
- ✅ Live duration display

**Advanced Options**:
- ✅ Refinement instructions textarea
- ✅ Collapsible panel to keep UI clean
- ✅ Example refinement hints

**Video Result Display**:
- ✅ HTML5 video player (controls, seeking)
- ✅ Metadata display (model, duration, generated time)
- ✅ Download button
- ✅ Generate another button (clears form)
- ✅ Success messaging with creatives integration

---

## API Reference

### Base URL
```
https://api.example.com/api/video
```

### Authentication
All endpoints require JWT bearer token:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Generate Video
```http
POST /api/video/generate
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "prompt": "Brand logo animation",
  "model": "sora-2-pro",
  "duration": 8,
  "referenceImageUrls": ["https://..."],
  "refinementPrompt": "Make it cinematic"
}

202 Accepted
{
  "videoUrl": "...",
  "videoPath": "...",
  "model": "sora-2-pro",
  "duration": 8,
  ...
}
```

#### List Models
```http
GET /api/video/models
Authorization: Bearer <jwt_token>

200 OK
[
  {
    "key": "sora-2-pro",
    "name": "OpenAI Sora 2 Pro",
    "durationRange": { "min": 5, "max": 60 },
    "supportsReferenceImages": true,
    "quality": "highest"
  },
  ...
]
```

#### Brand Animation (Example)
```http
POST /api/video/examples/brand-animation
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "brandLogoUrl": "https://...",
  "productName": "ProductName",
  "tagline": "Your tagline here"
}

202 Accepted
{ ... VideoGenerationResponse ... }
```

#### Product Showcase (Example)
```http
POST /api/video/examples/product-showcase
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "productName": "iPhone 15",
  "productDescription": "Latest flagship smartphone",
  "referenceImageUrls": ["https://..."]
}

202 Accepted
{ ... VideoGenerationResponse ... }
```

#### Social Media (Example)
```http
POST /api/video/examples/social-media
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "concept": "Product unboxing",
  "platform": "tiktok",
  "brandImages": ["https://..."]
}

202 Accepted
{ ... VideoGenerationResponse ... }
```

---

## Usage Examples

### Example 1: Brand Logo Animation

```typescript
// Frontend JavaScript/React
const response = await fetch('/api/video/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    prompt: 'Animated brand logo with motion graphics and transitions',
    model: 'sora-2-pro',
    duration: 6,
    referenceImageUrls: [
      'https://company.com/logo.png',
      'https://company.com/brand-colors.png'
    ],
    refinementPrompt: 'Professional, cinematic, premium quality'
  })
});

const result = await response.json();
console.log(`Video URL: ${result.videoUrl}`);
console.log(`Refined Prompt: ${result.refinedPrompt}`);
```

### Example 2: Product Showcase with Upload

```typescript
// Upload reference image first
const uploadFormData = new FormData();
uploadFormData.append('file', imageFile);

const uploadResponse = await fetch('/api/storage/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: uploadFormData
});

const uploadedImage = await uploadResponse.json();

// Generate video using uploaded image
const videoResponse = await fetch('/api/video/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    prompt: 'Professional product showcase video',
    model: 'sora-2-pro',
    duration: 10,
    referenceImageUrls: [uploadedImage.url],
    refinementPrompt: 'Modern, clean, corporate aesthetic'
  })
});
```

### Example 3: Social Media Optimization

```typescript
// Generate platform-specific videos
const generateForPlatform = async (platform: 'instagram' | 'tiktok' | 'youtube') => {
  const response = await fetch('/api/video/examples/social-media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      concept: 'Product announcement',
      platform: platform,
      brandImages: [
        'https://company.com/product.png',
        'https://company.com/logo.png'
      ]
    })
  });

  return await response.json();
};

// Generate for all platforms
const videos = await Promise.all([
  generateForPlatform('instagram'),
  generateForPlatform('tiktok'),
  generateForPlatform('youtube')
]);

videos.forEach(video => {
  console.log(`${video.metadata.generatedAt}: ${video.videoUrl}`);
});
```

### Example 4: Multi-Model Comparison

```typescript
// Test video generation with different models
const models = ['sora-2-pro', 'veo-3.1', 'runway-gen3'];

const comparisons = await Promise.all(
  models.map(model =>
    fetch('/api/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        prompt: 'Sunset on a beach with crashing waves',
        model: model,
        duration: 6,
        refinementPrompt: 'Cinematography: golden hour, calm, serene'
      })
    }).then(r => r.json())
  )
);

comparisons.forEach(video => {
  console.log(`${video.model} - ${video.videoUrl}`);
});
```

---

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
# Replicate API Key (required for video generation)
REPLICATE_API_KEY=<your-replicate-api-key>

# Poe API Configuration (for prompt refinement)
POE_API_URL=https://api.poe.com
POE_API_KEY=<your-poe-api-key>

# Cloudflare R2 Configuration (for video storage)
R2_BUCKET_NAME=<your-bucket-name>
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY_ID=<your-access-key>
R2_SECRET_ACCESS_KEY=<your-secret-key>
R2_ENDPOINT_URL=https://<account-id>.r2.cloudflarecustomdomain.com

# Video Storage Paths
VIDEO_STORAGE_PATH=videos/generated
REFERENCE_IMAGE_STORAGE_PATH=videos/references
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

### Model Defaults

**Default Model**: `sora-2-pro` (highest quality)
- Configurable in VideoGenerationService
- Users can override per request

**Default Duration**: 6 seconds
- Good balance between quality and generation time
- Can be adjusted 5-60 seconds per model

**Prompt Refinement**: Optional (not applied by default)
- Only runs if `refinementPrompt` provided in request
- Uses GPT-4o for highest quality enhancement

### Storage Configuration

**Reference Images**:
- Stored in `R2_STORAGE_PATH/references/`
- Cached for 7 days
- Auto-cleaned after 30 days

**Generated Videos**:
- Stored in `R2_STORAGE_PATH/generated/`
- Permanent storage (no expiration)
- Cached by CDN for fast delivery

---

## Troubleshooting

### Common Issues

#### 1. "Video generation failed: Invalid API key"
**Cause**: REPLICATE_API_KEY not set or invalid
**Solution**: 
- Check `.env` file has valid REPLICATE_API_KEY
- Test key at https://replicate.com/api/docs
- Restart backend after updating .env

#### 2. "Reference images failed to upload"
**Cause**: R2 storage not configured or credentials invalid
**Solution**:
- Verify R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
- Test R2 connectivity with aws-cli: `aws s3 ls s3://bucket-name`
- Check R2 bucket permissions allow PutObject

#### 3. "Duration out of range for model"
**Cause**: Requested duration outside model's supported range
**Solution**:
- Sora 2 Pro: 5-60 seconds
- Veo 3.1: 4-8 seconds
- Runway Gen-3: 4-60 seconds
- Check model capabilities via GET /api/video/models

#### 4. "Reference images not affecting output"
**Cause**: Model may not support reference images or images poorly formatted
**Solution**:
- Verify model supports reference images (check VideoModelDto.supportsReferenceImages)
- Use high-quality reference images (min 512x512)
- Try removing reference images and regenerating
- Check image URLs are publicly accessible

#### 5. "Prompt refinement not working"
**Cause**: POE_API_KEY not set or Poe API down
**Solution**:
- Optional feature - video generates without refinement
- Check POE_API_KEY environment variable
- Verify Poe API status at https://poe.com
- Remove refinementPrompt if not needed

#### 6. "Generated video takes too long"
**Cause**: Sora 2 Pro can take 2-5 minutes for complex prompts
**Solution**:
- Normal - video generation is computationally expensive
- Use simpler prompts for faster generation
- Try shorter duration (5 seconds vs 60 seconds)
- Consider using Veo 3.1 for faster results (4-8s limit)
- Monitor /logs/api.log for generation time metrics

### Debug Logging

Enable verbose logging in ReplicateClient:
```typescript
// api/src/engines/replicate.client.ts
private logger = new Logger('ReplicateClient');

// Will log:
// - API request/response
// - Duration adjustments
// - Reference image processing
// - Output format handling
// - Generation times
```

View logs:
```bash
tail -f logs/api.log | grep "ReplicateClient\|VideoGeneration"
```

### Health Check

Test endpoint availability:
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.example.com/api/video/models
```

Expected response: 200 OK with array of VideoModelDto

---

## Performance Metrics

### Generation Times (Approximate)

| Model | Duration | Time | Notes |
|-------|----------|------|-------|
| Sora 2 Pro | 5s | 2-3 min | Premium quality |
| Sora 2 Pro | 10s | 3-4 min | Still premium |
| Sora 2 Pro | 30s | 4-5 min | Longer wait |
| Veo 3.1 | 4-6s | 1-2 min | Faster alternative |
| Runway Gen-3 | 5s | 2-3 min | Reliable |
| Runway Gen-2 | 5s | 1-2 min | Budget option |

### Storage Usage

**Per Video Generated**:
- Reference images: 0.5-2 MB each
- Generated video (1080p): 30-80 MB
- Total per campaign: 100-500 MB for 10 videos

---

## Next Steps

### Planned Enhancements

1. **Video Templates**
   - Pre-designed templates for common use cases
   - Automatic prompt generation from template + parameters

2. **Batch Generation**
   - Generate multiple videos in parallel
   - Cost optimization for bulk operations

3. **Video Editing**
   - Post-generation trimming and effects
   - Multi-clip sequencing

4. **Analytics Integration**
   - Track video performance (views, engagement)
   - Link videos to conversion metrics
   - A/B testing framework

5. **Model Fine-tuning**
   - Custom Sora 2 models trained on brand aesthetic
   - Style consistency across campaign

---

## Support & Resources

- **Replicate Docs**: https://replicate.com/docs
- **OpenAI Sora**: https://openai.com/sora
- **Poe API Docs**: https://poe.com/api/docs
- **R2 Documentation**: https://developers.cloudflare.com/r2/

---

**Last Updated**: January 2025  
**Maintainer**: AI Freedom Studios Development Team  
**Version**: 1.0.0
