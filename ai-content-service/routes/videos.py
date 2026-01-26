"""
Video generation routes for AI content service.
Handles POST /v1/generate/video with async job tracking.
"""

from fastapi import APIRouter, HTTPException, Request
import logging
from models.requests import VideoGenerationRequest
from models.responses import VideoGenerationResponse, ErrorResponse
from providers.poe_provider import PoeProvider
from middleware.tenant_isolation import validate_tenant_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["videos"])
provider = PoeProvider()


def validate_video_duration(model: str, requested_duration: int) -> int:
    """Validate and adjust duration based on model requirements"""
    if model == "sora-2":
        allowed = [4, 8, 12]
        return min(allowed, key=lambda x: abs(x - requested_duration))
    elif model == "veo-3.1":
        if requested_duration <= 4:
            return 4
        elif requested_duration <= 6:
            return 6
        else:
            return 8
    elif model in ["runway-gen3", "runway-gen2"]:
        return min(max(1, requested_duration), 60)
    return requested_duration


@router.post(
    "/generate/video",
    response_model=VideoGenerationResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def generate_video(request: VideoGenerationRequest, http_request: Request):
    """
    Generate video content via AI model (async).
    
    This endpoint accepts video generation requests and returns a job_id
    for tracking. Use GET /v1/jobs/{job_id} to check status.
    
    Supported Models:
    - sora-2: Supports 4s, 8s, 12s durations (default: 8s)
    - veo-3.1: Supports 4s, 6s, 8s durations
    - runway-gen3: Supports 1-60s durations
    - runway-gen2: Supports 1-60s durations
    
    Example:
        POST /v1/generate/video
        {
            "prompt": "A drone flying over a mountain landscape",
            "model": "sora-2",
            "duration_seconds": 8,
            "aspect_ratio": "16:9",
            "tenant_id": "tenant_123"
        }
    
    Returns:
        VideoGenerationResponse with job_id for tracking
    """
    try:
        # Validate tenant access
        await validate_tenant_access(http_request, request.tenant_id)
        
        # Validate duration for model
        validated_duration = validate_video_duration(request.model, request.duration_seconds)
        
        logger.info(
            f"Video generation request for tenant {request.tenant_id}: "
            f"model={request.model}, duration={validated_duration}s"
        )
        
        # Submit async video generation job
        job_id = await provider.generate_video(
            prompt=request.prompt,
            model=request.model,
            duration_seconds=validated_duration,
            aspect_ratio=request.aspect_ratio,
            tenant_id=request.tenant_id,
        )
        
        logger.info(
            f"Video job created for tenant {request.tenant_id}: job_id={job_id}"
        )
        
        return VideoGenerationResponse(
            job_id=job_id,
            status="processing",
            model=request.model,
            duration_seconds=validated_duration,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation submission failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "video-generation"}
