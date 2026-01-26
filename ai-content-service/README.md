# AI Content Generation Service

Comprehensive FastAPI microservice for text, image, and video generation with tenant isolation and async job management.

## Features

✅ **Multi-Modal Generation**
- Text generation: social posts, ad copy, scripts, strategies, and prompt improvement
- Image generation: DALL-E 3 support with multiple resolutions and styles
- Video generation: Sora-2, Veo-3.1, Runway models with proper duration validation

✅ **Tenant Isolation**
- Thread-local tenant context for multi-tenant security
- Tenant ID validation on all requests
- Resource-level access control

✅ **Async Job Management**
- Celery task queue with Redis backend
- Progress tracking for long-running operations
- Webhook callbacks for job completion notifications
- Automatic retry with exponential backoff

✅ **Centralized Prompt Management**
- System prompts for 8+ content types
- Model-specific prompt enhancements
- Prompt improvement engine

## API Endpoints

### Text Generation
```bash
POST /v1/generate/text
{
  "prompt": "Write a social media post about...",
  "model": "gpt-4o",
  "system_prompt_type": "social-post",  # creative-copy, ad-script, campaign-strategy, prompt-improver
  "tenant_id": "tenant_123"
}
```

### Image Generation
```bash
POST /v1/generate/image
{
  "prompt": "A serene mountain landscape at sunset",
  "model": "dall-e-3",
  "resolution": "1024x1024",  # 1024x1024, 1792x1024, 1024x1792
  "style": "vivid",  # vivid or natural
  "tenant_id": "tenant_123"
}
```

### Video Generation (Async)
```bash
POST /v1/generate/video
{
  "prompt": "A cinematic shot of mountains",
  "model": "sora-2",  # sora-2, veo-3.1, runway-gen3
  "duration_seconds": 8,  # Sora-2: 4,8,12s | Veo-3.1: 4,6,8s | Runway: 1-60s
  "aspect_ratio": "16:9",
  "tenant_id": "tenant_123"
}

Response: { "job_id": "550e8400-e29b-41d4-a716-446655440000", "status": "processing" }
```

### Job Status
```bash
GET /v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

### Health Check
```bash
GET /health
GET /v1/docs  # Interactive API documentation
```

## Setup

### Prerequisites
- Python 3.11+
- Docker & Docker Compose (optional)
- Poe API Key
- Redis (for async jobs)

### Local Development

1. **Clone and setup**:
```bash
cd ai-content-service
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your POE_API_KEY
```

3. **Run service**:
```bash
uvicorn main:app --reload
```

Service runs at `http://localhost:8000`

### Docker Deployment

1. **Start services**:
```bash
docker-compose up -d
```

2. **With async support** (includes Celery worker and Flower monitoring):
```bash
docker-compose --profile async up -d
```

3. **Monitor jobs**:
```bash
# Flower monitoring UI
open http://localhost:5555
```

4. **View logs**:
```bash
docker-compose logs -f ai-content-service
docker-compose logs -f celery-worker
```

## Architecture

```
ai-content-service/
├── main.py                 # FastAPI entry point
├── models/
│   ├── requests.py        # Pydantic request models
│   └── responses.py       # Pydantic response models
├── providers/
│   ├── base.py           # Abstract provider interface
│   └── poe_provider.py   # Poe API implementation
├── routes/
│   ├── text.py           # POST /v1/generate/text
│   ├── images.py         # POST /v1/generate/image
│   ├── videos.py         # POST /v1/generate/video
│   └── jobs.py           # GET /v1/jobs/{job_id}
├── tasks/
│   ├── celery_app.py     # Celery configuration
│   └── generation_tasks.py # Async task definitions
├── templates/
│   └── prompts.py        # System prompts (8+ types)
└── middleware/
    └── tenant_isolation.py # Tenant context & validation
```

## Configuration

### Environment Variables

```bash
# Required
POE_API_KEY=your-poe-api-key

# Service Config
ENV=development              # development, staging, production
PORT=8000                   # Service port
HOST=0.0.0.0               # Bind address
CORS_ORIGINS=*             # Comma-separated CORS origins

# Async/Job Tracking
REDIS_URL=redis://localhost:6379/0
MONGO_URI=mongodb://localhost:27017/ai-content
WEBHOOK_BASE_URL=http://localhost:3000/api/v1/webhooks
```

## System Prompt Types

### Text Generation
- **creative-copy**: Persuasive marketing copy
- **social-post**: Engaging social media content
- **ad-script**: Direct response ad scripts  
- **campaign-strategy**: Marketing strategy and planning
- **prompt-improver**: Enhance other prompts

### Image Generation
- **creative-image**: High-quality marketing images
- **product-image**: E-commerce product photos

### Video Generation
- **creative-video**: Cinematic marketing videos
- **explainer-video**: Clear educational videos

## Prompt Improvement Example

Enhance weak prompts with the prompt-improver engine:

```bash
POST /v1/generate/text
{
  "prompt": "Make a video about AI",
  "model": "gpt-4o",
  "system_prompt_type": "prompt-improver",
  "tenant_id": "tenant_123"
}

Response:
{
  "content": "Create a cinematic video showcasing AI's impact on modern society. Include:\n- Dynamic visuals of technology in action\n- Clear visual explanations of AI concepts\n- Real-world applications and benefits\n- Professional color grading and pacing...",
  "model": "gpt-4o"
}
```

## Testing

### Manual API Testing

```bash
# Health check
curl http://localhost:8000/health

# Generate text
curl -X POST http://localhost:8000/v1/generate/text \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a funny social media post about coffee",
    "model": "gpt-4o",
    "system_prompt_type": "social-post",
    "tenant_id": "tenant_123"
  }'

# Generate video (returns job_id)
curl -X POST http://localhost:8000/v1/generate/video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A drone flying over mountains",
    "model": "sora-2",
    "duration_seconds": 8,
    "tenant_id": "tenant_123"
  }'

# Check job status
curl http://localhost:8000/v1/jobs/YOUR_JOB_ID
```

## Performance

- **Text Generation**: ~10-20 seconds (synchronous)
- **Image Generation**: ~30-60 seconds (synchronous)
- **Video Generation**: ~2-5 minutes (asynchronous via Celery)

## Tenant Isolation

All requests must include `tenant_id` parameter. The service enforces:
- ✅ Tenant context validation
- ✅ Resource access control
- ✅ Data storage isolation (R2 paths)
- ✅ Webhook callback isolation

## Next Phases

1. **Phase 3**: NestJS V1 Architecture (module reorganization)
2. **Phase 4**: Service Integration (connect NestJS to this service)
3. **Phase 5**: Dead Code Removal (clean up legacy code)
4. **Phase 6**: Testing & Deployment (full integration testing)

## Support

For issues or questions:
- Check `.github/prompts/plan-aiContentMicroserviceV1Architecture.prompt.md`
- Review `DEAD_CODE_ANALYSIS_SUMMARY.md`
- See `docs/architecture.md` for architecture details
- Check `IMPLEMENTATION_CHANGELOG.md` for implementation status
