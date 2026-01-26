"""
Abstract base provider for AI content generation.
Defines interface for all provider implementations.
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseProvider(ABC):
    """Abstract base class for AI content providers"""
    
    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        model: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        tenant_id: Optional[str] = None
    ) -> str:
        """Generate text content"""
        pass
    
    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        model: str,
        resolution: str = "1024x1024",
        style: Optional[str] = None,
        tenant_id: Optional[str] = None
    ) -> str:
        """Generate image content"""
        pass
    
    @abstractmethod
    async def generate_video(
        self,
        prompt: str,
        model: str,
        duration_seconds: int = 8,
        aspect_ratio: str = "16:9",
        tenant_id: Optional[str] = None
    ) -> str:
        """Generate video content (returns job_id for async)"""
        pass
    
    @abstractmethod
    async def get_job_status(self, job_id: str) -> dict:
        """Get status of async generation job"""
        pass
