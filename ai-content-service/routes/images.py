"""
Image generation routes for AI content service.
Handles POST /v1/generate/image with various models and styles.
"""

from fastapi import APIRouter, HTTPException, Request
import logging
from models.requests import ImageGenerationRequest
from models.responses import ImageGenerationResponse, ErrorResponse
from providers.poe_provider import PoeProvider
from middleware.tenant_isolation import validate_tenant_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["images"])
provider = PoeProvider()


def validate_image_resolution(model: str, resolution: str) -> str:
    """Validate resolution per model capabilities"""
    if model == "dall-e-3":
        valid = ["1024x1024", "1792x1024", "1024x1792"]
        return resolution if resolution in valid else "1024x1024"
    return resolution


@router.post(
    "/generate/image",
    response_model=ImageGenerationResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def generate_image(request: ImageGenerationRequest, http_request: Request):
    """
    Generate image content via AI model.
    
    Models:
    - dall-e-3: High-quality realistic images
    
    Resolutions (for dall-e-3):
    - 1024x1024: Square (default)
    - 1792x1024: Wide
    - 1024x1792: Tall
    
    Styles:
    - vivid: More vibrant, saturated colors
    - natural: More muted, realistic tones
    
    Example:
        POST /v1/generate/image
        {
            "prompt": "A serene mountain landscape at sunset",
            "model": "dall-e-3",
            "resolution": "1024x1024",
            "style": "vivid",
            "tenant_id": "tenant_123"
        }
    
    Returns:
        ImageGenerationResponse with image URL (stored in R2)
    """
    try:
        # Validate tenant access
        await validate_tenant_access(http_request, request.tenant_id)
        
        # Validate resolution for model
        validated_resolution = validate_image_resolution(request.model, request.resolution)
        
        logger.info(
            f"Image generation request for tenant {request.tenant_id}: "
            f"model={request.model}, resolution={validated_resolution}"
        )
        
        # Generate image via provider
        image_url = await provider.generate_image(
            prompt=request.prompt,
            model=request.model,
            resolution=validated_resolution,
            style=request.style,
            tenant_id=request.tenant_id,
        )
        
        logger.info(f"Image generated for tenant {request.tenant_id}")
        
        return ImageGenerationResponse(
            url=image_url,
            model=request.model,
            resolution=validated_resolution,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "image-generation"}
