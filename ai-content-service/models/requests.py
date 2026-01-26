"""
Pydantic request models for AI content generation.
Unified schema for text, image, and video generation.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


class BaseGenerationRequest(BaseModel):
    """Base request model for all generation types"""
    prompt: str = Field(..., description="Generation prompt")
    model: str = Field(..., description="Model to use")
    tenant_id: str = Field(..., description="Tenant ID for isolation")
    webhook_url: Optional[str] = Field(None, description="Webhook for async results")
    metadata: Optional[dict] = Field(None, description="Additional metadata")

    class Config:
        """Pydantic config"""
        str_strip_whitespace = True


class TextGenerationRequest(BaseGenerationRequest):
    """Request for text content generation"""
    max_tokens: int = Field(default=2000, ge=1, le=4000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    system_prompt_type: Optional[Literal[
        "creative-copy",
        "social-post",
        "ad-script",
        "campaign-strategy",
        "prompt-improver"
    ]] = Field(None, description="Predefined prompt type")
    context: Optional[str] = Field(None, description="Additional context for prompt improvement")


class ImageGenerationRequest(BaseGenerationRequest):
    """Request for image generation"""
    resolution: str = Field(default="1024x1024", description="Resolution (e.g., 1024x1024)")
    style: Optional[Literal["vivid", "natural"]] = Field(None, description="Image style")
    negative_prompt: Optional[str] = Field(None, description="Elements to avoid in generation")


class VideoGenerationRequest(BaseGenerationRequest):
    """Request for video generation"""
    duration_seconds: int = Field(default=8, ge=1, le=60)
    aspect_ratio: str = Field(default="16:9", description="Aspect ratio (16:9, 9:16, 1:1)")
    fps: int = Field(default=24, ge=12, le=60)
    reference_images: Optional[list[str]] = Field(None, description="Reference image URLs")


class PromptImprovementRequest(BaseModel):
    """Request to improve an existing prompt"""
    prompt: str = Field(..., description="Prompt to improve")
    content_type: Literal["text", "image", "video"] = Field(..., description="Type of content")
    tenant_id: str = Field(..., description="Tenant ID")
