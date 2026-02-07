# V1 API Integration Guide

## Phase 4: Service Integration (Implementation in Progress)

This guide explains how to integrate the new V1 architecture with the AI Content Service microservice.

## Architecture Overview

```
NestJS Application (api/)
    ↓
V1AppModule (src/v1/v1-app.module.ts)
    ├─ CoreModule
    │   ├─ AuthModuleV1
    │   ├─ PaymentsModule
    │   ├─ TenantsModuleV1
    │   ├─ ContentModule ← NEW: AI Content Service integration
    │   │   ├─ AIContentServiceClient (HTTP client)
    │   │   ├─ ContentGenerationService (orchestration)
    │   │   └─ ContentGenerationController (REST endpoints)
    │   └─ EnginesModuleV1
    ├─ FeaturesModule
    │   ├─ CampaignsModuleV1
    │   ├─ CreativesModuleV1
    │   └─ SocialModuleV1
    └─ InfrastructureModule
        └─ StorageModule

Python AI Content Service (ai-content-service/)
    ├─ main.py (FastAPI entry point)
    ├─ models/ (Pydantic request/response models)
    ├─ providers/ (BaseProvider, PoeProvider)
    ├─ routes/ (text, images, videos, jobs)
    ├─ tasks/ (Celery async tasks)
    ├─ middleware/ (tenant isolation)
    └─ docker-compose.yml (Redis, MongoDB, Celery)
```

## Key Components

### 1. AIContentServiceClient

**Location**: `api/src/v1/core/content/ai-content-service.client.ts`

Low-level HTTP client for Python microservice communication.

**Features**:
- Automatic retry logic with exponential backoff
- Tenant ID validation
- Error handling and logging
- Timeout management

**Methods**:
```typescript
// Generate text
generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>

// Improve prompts
improvePrompt(prompt: string, tenantId: string): Promise<TextGenerationResponse>

// Generate images
generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>

// Generate videos (async)
generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>

// Poll job status
getJobStatus(jobId: string, tenantId: string): Promise<JobStatusResponse>

// Health check
healthCheck(): Promise<boolean>
```

### 2. ContentGenerationService

**Location**: `api/src/v1/core/content/content-generation.service.ts`

High-level orchestration service for content generation.

**Responsibilities**:
- Validation of generation requests
- Coordination with AIContentServiceClient
- Job tracking and metadata storage
- Result caching and storage
- Webhook callback handling
- Rate limiting and quota enforcement

**Key Methods**:
```typescript
// Text generation
generateText(request: TextGenerationRequest, userId?: string): Promise<TextGenerationResponse>

// Prompt improvement
improvePrompt(prompt: string, tenantId: string, userId?: string): Promise<TextGenerationResponse>

// Image generation
generateImage(request: ImageGenerationRequest, userId?: string): Promise<ImageGenerationResponse>

// Video generation (async)
generateVideo(request: VideoGenerationRequest, webhookUrl?: string, userId?: string): Promise<VideoGenerationResponse>

// Job status polling
getJobStatus(jobId: string, tenantId: string): Promise<JobStatusResponse>

// Webhook callback handler
handleGenerationCallback(jobId: string, status: 'success' | 'failure', result?: any, error?: string): Promise<void>
```

### 3. ContentGenerationController

**Location**: `api/src/v1/core/content/content-generation.controller.ts`

REST API endpoints for content generation.

**Routes** (all under `/v1/content/`):

```bash
# Text Generation
POST /v1/content/generate/text
{
  "prompt": "Write a social media post",
  "model": "gpt-4o",
  "system_prompt_type": "social-post",
  "tenant_id": "tenant_123"
}
→ { content: string, model: string, ... }

# Prompt Improvement
POST /v1/content/improve-prompt
{
  "prompt": "Make a video about AI",
  "tenant_id": "tenant_123"
}
→ { content: "Improved prompt...", model: string, ... }

# Image Generation
POST /v1/content/generate/image
{
  "prompt": "A serene mountain landscape",
  "model": "dall-e-3",
  "resolution": "1024x1024",
  "tenant_id": "tenant_123"
}
→ { url: string, storage_path: string, ... }

# Video Generation (Async)
POST /v1/content/generate/video
{
  "prompt": "A cinematic mountain shot",
  "model": "sora-2",
  "duration_seconds": 8,
  "tenant_id": "tenant_123"
}
→ { job_id: string, status: "processing", created_at: string }

# Job Status
GET /v1/content/jobs/{jobId}
→ { job_id: string, status: "processing", progress: 45, ... }

# Health Check
GET /v1/content/health
→ { status: "healthy", message: "..." }
```

## Integration Steps

### Step 1: Setup V1AppModule

Update `app.module.ts` to include V1AppModule:

```typescript
import { V1AppModule } from './v1/v1-app.module';

@Module({
  imports: [
    // ... existing imports ...
    V1AppModule,
  ],
})
export class AppModule {}
```

### Step 2: Configure Environment Variables

Add to `.env`:

```bash
# AI Content Service
AI_CONTENT_SERVICE_URL=http://localhost:8000
# or production URL
# AI_CONTENT_SERVICE_URL=https://api-content.aifreedoinstudios.com

# API Base URL for webhooks
API_BASE_URL=http://localhost:3000
```

### Step 3: Start AI Content Service

```bash
cd ai-content-service
docker-compose up -d

# Or with async support (Celery workers)
docker-compose --profile async up -d
```

### Step 4: Test Integration

```bash
# Text generation
curl -X POST http://localhost:3000/v1/content/generate/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a funny social media post",
    "model": "gpt-4o",
    "system_prompt_type": "social-post",
    "tenant_id": "tenant_123"
  }'

# Video generation
curl -X POST http://localhost:3000/v1/content/generate/video \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cinematic mountain shot",
    "model": "sora-2",
    "duration_seconds": 8,
    "tenant_id": "tenant_123"
  }'

# Poll job status
curl http://localhost:3000/v1/content/jobs/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Migrating Existing Services

### CreativesService Migration

Current flow:
```
CreativesService → PoeProvider → Poe API
```

New flow:
```
CreativesService → ContentGenerationService → AIContentServiceClient → Python Service
```

**Migration Steps**:

1. Inject ContentGenerationService
2. Replace direct PoeProvider calls with ContentGenerationService methods
3. Update video generation to use async job tracking
4. Implement webhook handlers for video completion

**Example**:

```typescript
// Before
const response = await this.poeProvider.generateText(prompt);

// After
const response = await this.contentGenerationService.generateText({
  prompt,
  tenant_id: tenantId,
  system_prompt_type: 'creative-copy',
  model: 'gpt-4o'
}, userId);
```

## Async Video Generation Flow

```
1. POST /v1/content/generate/video
   ↓ (returns immediately)
   {job_id, status: "processing"}

2. Celery task starts in Python service
   ↓
3. Python service sends progress updates
   ↓
4. Video generation completes
   ↓
5. POST /v1/content/webhooks/video-complete
   ↓
6. NestJS stores result in database
   ↓
7. Client polls GET /v1/content/jobs/{jobId}
   ↓
   {job_id, status: "completed", result: {url, ...}}
```

## System Prompt Types

### Text Generation
- **creative-copy**: Persuasive marketing copy
- **social-post**: Social media engagement
- **ad-script**: Direct response ads
- **campaign-strategy**: Strategic planning
- **prompt-improver**: Enhance weak prompts (internal)

### Image Generation
- **creative-image**: High-quality marketing images
- **product-image**: E-commerce product photos

### Video Generation
- **creative-video**: Cinematic marketing videos
- **explainer-video**: Educational tutorials

## Error Handling

The service handles several error scenarios:

**Validation Errors** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Invalid system_prompt_type",
  "error": "Bad Request"
}
```

**Service Unavailable** (503 Service Unavailable):
```json
{
  "statusCode": 503,
  "message": "AI Content Service is unavailable"
}
```

**Server Errors** (500 Internal Server Error):
```json
{
  "statusCode": 500,
  "message": "Content generation failed"
}
```

## Rate Limiting & Quotas

Planned enhancements:
- Per-tenant rate limits (requests/minute)
- Token usage quotas (for text generation)
- Concurrent video generation limits
- Storage quotas for generated assets

## Monitoring & Debugging

### Health Check

```bash
curl http://localhost:3000/v1/content/health
```

### Logs

```bash
# NestJS logs
docker-compose logs -f api

# Python service logs
docker logs -f ai-content-service

# Celery worker logs
docker logs -f celery-worker

# Flower monitoring dashboard
open http://localhost:5555
```

## Next Phases

- **Phase 5**: Remove dead code (video/, video-workflow/, etc.)
- **Phase 6**: Complete test coverage and deployment

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   NestJS Application                         │
├─────────────────────────────────────────────────────────────┤
│  /v1/content/generate/text                                   │
│  /v1/content/generate/image                                  │
│  /v1/content/generate/video (async)                          │
│  /v1/content/jobs/{jobId}                                    │
└─────────────────────────────────────────────────────────────┘
           ↓ HTTP (with retry & backoff)
┌─────────────────────────────────────────────────────────────┐
│          Python AI Content Service                            │
├─────────────────────────────────────────────────────────────┤
│  /v1/generate/text     → Poe API (gpt-4o)                   │
│  /v1/generate/image    → Poe API (dall-e-3)                │
│  /v1/generate/video    → Poe API (Sora-2, Veo, Runway)    │
│  /v1/jobs/{jobId}      ← Celery status tracker             │
└─────────────────────────────────────────────────────────────┘
           ↓ async tasks
┌─────────────────────────────────────────────────────────────┐
│  Celery Workers + Redis + MongoDB                            │
└─────────────────────────────────────────────────────────────┘
```

## Support & Documentation

- Architecture details: `docs/architecture.md`
- Dead code analysis: `DEAD_CODE_ANALYSIS_SUMMARY.md`
- Implementation plan: `.github/prompts/plan-aiContentMicroserviceV1Architecture.prompt.md`
- Python service README: `ai-content-service/README.md`
