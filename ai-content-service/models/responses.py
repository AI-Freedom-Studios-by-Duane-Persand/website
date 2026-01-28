"""
Pydantic response models for AI content generation.
Unified response structure for all generation endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TextGenerationResponse(BaseModel):
    """Response for text generation"""
    content: str = Field(..., description="Generated text content")
    model: str = Field(..., description="Model used")
    tokens_used: Optional[int] = Field(None, description="Tokens consumed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ImageGenerationResponse(BaseModel):
    """Response for image generation"""
    url: str = Field(..., description="Generated image URL (in R2)")
    model: str = Field(..., description="Model used")
    resolution: str = Field(..., description="Image resolution")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class VideoGenerationResponse(BaseModel):
    """Response for video generation"""
    job_id: str = Field(..., description="Async job ID")
    status: str = Field(default="processing", description="Job status")
    model: str = Field(..., description="Model used")
    duration_seconds: int = Field(..., description="Video duration")
    message: Optional[str] = Field(None, description="Optional message (e.g., duration adjustment notice)")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class JobStatusResponse(BaseModel):
    """Response for job status queries"""
    job_id: str = Field(..., description="Job ID")
    status: str = Field(..., description="Current status: pending, processing, completed, failed")
    progress: int = Field(default=0, description="Progress percentage (0-100)")
    result: Optional[dict] = Field(None, description="Result data if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional details")
    code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
