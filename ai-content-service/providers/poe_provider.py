"""
Poe API provider for AI content generation.
Handles text, image, and video generation via Poe API using fastapi_poe.
"""

import os
import logging
from typing import Optional
import fastapi_poe as fp
from .base import BaseProvider

logger = logging.getLogger(__name__)


class PoeProvider(BaseProvider):
    """Poe AI provider for content generation"""
    
    def __init__(self):
        """Initialize Poe provider"""
        self.poe_api_key = os.getenv("POE_API_KEY")
        if not self.poe_api_key:
            logger.warning("POE_API_KEY not configured")
    
    async def generate_text(
        self,
        prompt: str,
        model: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        tenant_id: Optional[str] = None
    ) -> str:
        """
        Generate text via Poe API.
        
        Args:
            prompt: User prompt
            model: Model to use (e.g., GPT-4o)
            system_prompt: System prompt for context
            max_tokens: Maximum tokens to generate
            temperature: Temperature for randomness
            tenant_id: Tenant ID for isolation
        
        Returns:
            Generated text content
        
        Raises:
            Exception: If API call fails
        """
        logger.info(f"Generating text for tenant {tenant_id} with model {model}")
        
        try:
            # Build messages
            messages = []
            if system_prompt:
                messages.append(fp.ProtocolMessage(role="system", content=system_prompt))
            messages.append(fp.ProtocolMessage(role="user", content=prompt))
            
            # Map model names to Poe bot names
            bot_name = self._map_model_to_bot(model)
            
            # Collect full response
            full_response = ""
            async for partial in fp.get_bot_response(
                messages=messages,
                bot_name=bot_name,
                api_key=self.poe_api_key
            ):
                full_response += partial.text
            
            logger.info(f"Text generation successful for tenant {tenant_id}, length: {len(full_response)}")
            return full_response
        
        except Exception as e:
            logger.error(f"Text generation failed for tenant {tenant_id}: {str(e)}")
            raise
    
    async def generate_image(
        self,
        prompt: str,
        model: str,
        resolution: str = "1024x1024",
        style: Optional[str] = None,
        tenant_id: Optional[str] = None
    ) -> str:
        """
        Generate image via Poe API.
        
        Args:
            prompt: Image description prompt
            model: Model to use (e.g., dall-e-3)
            resolution: Image resolution
            style: Image style (vivid, natural)
            tenant_id: Tenant ID for isolation
        
        Returns:
            Generated image URL
        
        Raises:
            Exception: If API call fails
        """
        logger.info(f"Generating image for tenant {tenant_id} with model {model}")
        
        try:
            # Build enhanced prompt with style and resolution
            enhanced_prompt = prompt
            if style:
                enhanced_prompt = f"{prompt} (style: {style})"
            if resolution:
                enhanced_prompt = f"{enhanced_prompt} (resolution: {resolution})"
            
            # Map model to Poe bot
            bot_name = self._map_model_to_bot(model)
            
            # Generate image
            message = fp.ProtocolMessage(role="user", content=enhanced_prompt)
            full_response = ""
            async for partial in fp.get_bot_response(
                messages=[message],
                bot_name=bot_name,
                api_key=self.poe_api_key
            ):
                full_response += partial.text
            
            # Extract image URL from response (Poe returns markdown with image)
            # Format: ![image](url) or just the URL
            import re
            url_match = re.search(r'https?://[^\s\)]+', full_response)
            if url_match:
                image_url = url_match.group(0)
                logger.info(f"Image generation successful for tenant {tenant_id}")
                return image_url
            else:
                logger.warning(f"No image URL found in response: {full_response[:200]}")
                return full_response  # Return full response if no URL found
        
        except Exception as e:
            logger.error(f"Image generation failed for tenant {tenant_id}: {str(e)}")
            raise
    
    async def generate_video(
        self,
        prompt: str,
        model: str,
        duration_seconds: int = 8,
        aspect_ratio: str = "16:9",
        tenant_id: Optional[str] = None
    ) -> str:
        """
        Generate video via Poe API (async).
        
        Args:
            prompt: Video description prompt
            model: Model to use (e.g., sora-2)
            duration_seconds: Video duration
            aspect_ratio: Video aspect ratio
            tenant_id: Tenant ID for isolation
        
        Returns:
            Job ID for async tracking
        
        Raises:
            Exception: If API call fails
        """
        logger.info(f"Generating video for tenant {tenant_id} with model {model}, duration={duration_seconds}s")
        
        try:
            # Build enhanced prompt with aspect ratio and duration
            enhanced_prompt = f"{prompt}"
            if aspect_ratio:
                enhanced_prompt = f"{enhanced_prompt} (aspect ratio: {aspect_ratio})"
            
            # Map model to Poe bot
            bot_name = self._map_model_to_bot(model)
            
            # Create message with custom parameters for video generation
            # Duration is passed via the parameters field as per Poe API docs
            message = fp.ProtocolMessage(
                role="user",
                content=enhanced_prompt,
                parameters={
                    "duration": duration_seconds,
                    "aspect_ratio": aspect_ratio,
                }
            )
            
            # Submit async video generation job to Poe API
            # This returns immediately with a job that can be polled
            full_response = ""
            async for partial in fp.get_bot_response(
                messages=[message],
                bot_name=bot_name,
                api_key=self.poe_api_key
            ):
                full_response += partial.text
            
            # Extract job ID from response if available, otherwise use response as job ID
            # Poe video bots return a reference/ID for tracking
            logger.info(f"Video job submitted for tenant {tenant_id}: {full_response[:100]}")
            
            # If response contains a URL or job ID, use it; otherwise use the response as identifier
            import re
            job_id_match = re.search(r'job[_-]?id["\']?\s*[:=]\s*["\']?([a-zA-Z0-9\-]+)["\']?', full_response, re.IGNORECASE)
            if job_id_match:
                return job_id_match.group(1)
            
            # Check for URL pattern (video services often return URLs directly)
            url_match = re.search(r'https?://[^\s\)]+', full_response)
            if url_match:
                url = url_match.group(0)
                logger.info(f"Video generated synchronously for tenant {tenant_id}: {url}")
                # Store as job_id so polling returns the URL immediately
                return f"video:{url}"
            
            # Fallback: use first 100 chars of response as job identifier
            job_id = full_response[:100].replace('\n', ' ')
            logger.info(f"Video job tracked with response: {job_id}")
            return job_id
        
        except Exception as e:
            logger.error(f"Video generation failed for tenant {tenant_id}: {str(e)}")
            raise
    
    async def get_job_status(self, job_id: str) -> dict:
        """
        Get status of async generation job.
        
        Args:
            job_id: Job ID from generation request
        
        Returns:
            Job status dict: {status, progress, result?, error?}
        
        Raises:
            Exception: If job not found or API fails
        """
        logger.info(f"Checking status of job {job_id}")
        
        try:
            # Check if this is a direct video URL (synchronous generation)
            if job_id.startswith("video:"):
                url = job_id.replace("video:", "")
                logger.info(f"Returning synchronously generated video URL: {url}")
                return {
                    "status": "completed",
                    "progress": 100,
                    "result": url,
                    "job_id": job_id,
                }
            
            # For async jobs, Poe API would be polled here
            # Since Poe SDK doesn't have built-in async polling for video,
            # we return a processing status
            # In production, you would:
            # 1. Store job_id in a database when submitted
            # 2. Have a background worker poll Poe API for status
            # 3. Update database with final URL when complete
            
            logger.info(f"Job {job_id} status: currently processing")
            return {
                "status": "processing",
                "progress": 50,
                "job_id": job_id,
            }
        
        except Exception as e:
            logger.error(f"Failed to get job status for {job_id}: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "job_id": job_id,
            }
    
    def _map_model_to_bot(self, model: str) -> str:
        """
        Map generic model names to Poe bot names.
        
        Args:
            model: Generic model name (e.g., gpt-4o, claude-3.5-sonnet)
        
        Returns:
            Poe bot name
        """
        model_map = {
            "gpt-4o": "GPT-4o",
            "gpt-4": "GPT-4",
            "gpt-3.5-turbo": "ChatGPT",
            "claude-3.5-sonnet": "Claude-3.5-Sonnet",
            "claude-3-opus": "Claude-3-Opus",
            "claude-3-sonnet": "Claude-3-Sonnet",
            "claude-3-haiku": "Claude-3-Haiku",
            "gemini-pro": "Gemini-Pro",
            "dall-e-3": "DALL-E-3",
            "sora-2": "Sora-2",
            "veo-3.1": "Veo-3.1",
            "runway-gen3": "Runway-Gen3",
        }
        
        bot_name = model_map.get(model, "GPT-4o")  # Default to GPT-4o
        logger.debug(f"Mapped model '{model}' to bot '{bot_name}'")
        return bot_name
