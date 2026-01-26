"""
Text generation routes for AI content service.
Handles POST /v1/generate/text with support for various prompt types.
Includes prompt improvement via system_prompt_type="prompt-improver".
"""

from fastapi import APIRouter, HTTPException
import logging
from models.requests import TextGenerationRequest
from models.responses import TextGenerationResponse, ErrorResponse
from providers.poe_provider import PoeProvider
from templates.prompts import get_system_prompt, build_full_prompt
from middleware.tenant_isolation import validate_tenant_access
from fastapi import Request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["text"])
provider = PoeProvider()


@router.post(
    "/generate/text",
    response_model=TextGenerationResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def generate_text(request: TextGenerationRequest, http_request: Request):
    """
    Generate text content with support for various prompt types.
    
    Prompt Types:
    - creative-copy: Persuasive marketing copy
    - social-post: Engaging social media content
    - ad-script: Direct response ad scripts
    - campaign-strategy: Marketing strategy
    - prompt-improver: Enhance other prompts
    
    Examples:
        1. Generate social post:
        POST /v1/generate/text
        {
            "prompt": "Product: eco-friendly water bottles",
            "model": "gpt-4o",
            "system_prompt_type": "social-post",
            "tenant_id": "tenant_123"
        }
        
        2. Improve a prompt:
        POST /v1/generate/text
        {
            "prompt": "Make a video about AI",
            "model": "gpt-4o",
            "system_prompt_type": "prompt-improver",
            "content_type": "video",
            "tenant_id": "tenant_123"
        }
    
    Returns:
        TextGenerationResponse with generated content
    """
    try:
        # Validate tenant access
        await validate_tenant_access(http_request, request.tenant_id)
        
        logger.info(
            f"Text generation request for tenant {request.tenant_id}: "
            f"type={request.system_prompt_type}, model={request.model}"
        )
        
        # Get system prompt
        system_prompt_type = request.system_prompt_type or "creative-copy"
        system_prompt = get_system_prompt(system_prompt_type, request.model)
        
        # Generate text via Poe provider
        content = await provider.generate_text(
            prompt=request.prompt,
            model=request.model,
            system_prompt=system_prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            tenant_id=request.tenant_id,
        )
        
        logger.info(f"Text generated for tenant {request.tenant_id}")
        
        return TextGenerationResponse(
            content=content,
            model=request.model,
            tokens_used=None,  # Would be populated from API response
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/improve-prompt",
    response_model=TextGenerationResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def improve_prompt(request_data: dict, http_request: Request):
    """
    Improve an existing prompt for better AI generation results.
    
    This is a convenience endpoint that calls /v1/generate/text
    with system_prompt_type="prompt-improver".
    
    Request format:
    {
        "prompt": "Make a video about AI",
        "content_type": "video",  # text, image, or video
        "tenant_id": "tenant_123"
    }
    
    Returns:
        Improved prompt as TextGenerationResponse
    """
    try:
        prompt = request_data.get("prompt")
        content_type = request_data.get("content_type", "text")
        tenant_id = request_data.get("tenant_id")
        
        if not prompt or not tenant_id:
            raise HTTPException(status_code=400, detail="Missing prompt or tenant_id")
        
        # Validate tenant
        await validate_tenant_access(http_request, tenant_id)
        
        logger.info(f"Improving prompt for {content_type} in tenant {tenant_id}")
        
        # Generate improved prompt
        system_prompt = get_system_prompt("prompt-improver")
        
        improved = await provider.generate_text(
            prompt=f"Improve this {content_type} prompt: {prompt}",
            model="gpt-4o",
            system_prompt=system_prompt,
            tenant_id=tenant_id,
        )
        
        return TextGenerationResponse(
            content=improved,
            model="gpt-4o",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prompt improvement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "text-generation"}
