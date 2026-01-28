"""
Poe API provider for AI content generation.
Handles text, image, and video generation via Poe API using fastapi_poe.
"""

import os
import logging
from typing import Optional, Dict
import fastapi_poe as fp
import uuid
import asyncio
from .base import BaseProvider

logger = logging.getLogger(__name__)

# In-memory job storage for demo purposes
# In production, use a database or Redis
JOB_STORAGE: Dict[str, dict] = {}


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
        Generate video via Poe API (async, non-blocking).
        
        Returns immediately with a job_id. The actual generation happens in background.
        Use get_job_status(job_id) to poll for completion.
        
        Args:
            prompt: Video description prompt
            model: Model to use (e.g., sora-2)
            duration_seconds: Video duration
            aspect_ratio: Video aspect ratio
            tenant_id: Tenant ID for isolation
        
        Returns:
            Job ID for async tracking
        
        Raises:
            Exception: If job submission fails
        """
        logger.info(f"Submitting video generation for tenant {tenant_id} with model {model}, duration={duration_seconds}s")
        
        # Generate unique job ID immediately
        job_id = f"vid_{uuid.uuid4().hex[:12]}"
        
        # Store job metadata
        JOB_STORAGE[job_id] = {
            "status": "pending",
            "model": model,
            "prompt": prompt,
            "duration_seconds": duration_seconds,
            "aspect_ratio": aspect_ratio,
            "tenant_id": tenant_id,
            "result": None,
            "error": None,
        }
        
        # Submit actual generation as background task (don't await)
        # This allows us to return immediately without blocking
        try:
            asyncio.create_task(
                self._generate_video_background(
                    job_id=job_id,
                    prompt=prompt,
                    model=model,
                    duration_seconds=duration_seconds,
                    aspect_ratio=aspect_ratio,
                    tenant_id=tenant_id,
                )
            )
            logger.info(f"Video generation job submitted: {job_id}")
            return job_id
        except Exception as e:
            JOB_STORAGE[job_id]["status"] = "failed"
            JOB_STORAGE[job_id]["error"] = str(e)
            logger.error(f"Failed to submit video generation: {str(e)}")
            raise
    
    async def _generate_video_background(
        self,
        job_id: str,
        prompt: str,
        model: str,
        duration_seconds: int,
        aspect_ratio: str,
        tenant_id: Optional[str],
    ) -> None:
        """
        Background task for actual video generation (runs async).
        This is called in the background and doesn't block the API response.
        """
        try:
            logger.info(f"Starting background video generation for job {job_id}")
            JOB_STORAGE[job_id]["status"] = "processing"
            
            # Build enhanced prompt with aspect ratio and duration
            enhanced_prompt = f"{prompt}"
            if aspect_ratio:
                enhanced_prompt = f"{enhanced_prompt} (aspect ratio: {aspect_ratio})"
            
            # Map model to Poe bot
            bot_name = self._map_model_to_bot(model)
            
            # Create message with custom parameters for video generation
            # Duration is passed via the parameters field as per Poe API docs
            # IMPORTANT: OpenAI Sora requires duration as STRING literal ('4', '8', '12'), not integer
            message = fp.ProtocolMessage(
                role="user",
                content=enhanced_prompt,
                parameters={
                    "duration": str(duration_seconds),  # Convert to string for API compatibility
                    "aspect_ratio": aspect_ratio,
                }
            )
            
            # Call Poe API (this may take 60+ seconds)
            full_response = ""
            async for partial in fp.get_bot_response(
                messages=[message],
                bot_name=bot_name,
                api_key=self.poe_api_key
            ):
                full_response += partial.text
            
            logger.info(f"Poe API response received for job {job_id}: {full_response[:100]}")
            
            # Extract result from response
            import re
            
            # Check for URL pattern (video services often return URLs directly)
            url_match = re.search(r'https?://[^\s\)]+', full_response)
            if url_match:
                url = url_match.group(0)
                logger.info(f"Video generated successfully for job {job_id}: {url}")
                JOB_STORAGE[job_id]["status"] = "completed"
                JOB_STORAGE[job_id]["result"] = {"video_url": url}
                return
            
            # Check for job ID in response
            job_id_match = re.search(r'job[_-]?id["\']?\s*[:=]\s*["\']?([a-zA-Z0-9\-]+)["\']?', full_response, re.IGNORECASE)
            if job_id_match:
                poe_job_id = job_id_match.group(1)
                logger.info(f"Video job queued at Poe for job {job_id}: {poe_job_id}")
                JOB_STORAGE[job_id]["status"] = "processing"
                JOB_STORAGE[job_id]["result"] = {"poe_job_id": poe_job_id}
                return
            
            # If we got here, it's still processing (Poe returns "Generating..." status updates)
            logger.info(f"Video generation in progress for job {job_id}")
            JOB_STORAGE[job_id]["status"] = "processing"
            JOB_STORAGE[job_id]["result"] = {"status_text": full_response[:200]}
            
        except Exception as e:
            logger.error(f"Background video generation failed for job {job_id}: {str(e)}")
            JOB_STORAGE[job_id]["status"] = "failed"
            JOB_STORAGE[job_id]["error"] = str(e)
    
    async def get_job_status(self, job_id: str) -> dict:
        """
        Get status of async generation job.
        
        Args:
            job_id: Job ID from generation request
        
        Returns:
            Job status dict: {status, progress, result?, error?}
        """
        logger.info(f"Checking status of job {job_id}")
        
        try:
            # Look up job in storage
            if job_id not in JOB_STORAGE:
                logger.warning(f"Job {job_id} not found in storage")
                return {
                    "status": "failed",
                    "error": f"Job {job_id} not found",
                    "job_id": job_id,
                }
            
            job = JOB_STORAGE[job_id]
            status = job["status"]
            
            # Map internal status to progress percentage
            progress_map = {
                "pending": 10,
                "processing": 50,
                "completed": 100,
                "failed": 0,
            }
            progress = progress_map.get(status, 0)
            
            response = {
                "status": status,
                "progress": progress,
                "job_id": job_id,
            }
            
            # Add result if completed
            if status == "completed" and job["result"]:
                response["result"] = job["result"]
            
            # Add error if failed
            if status == "failed" and job["error"]:
                response["error"] = job["error"]
            
            logger.info(f"Job {job_id} status: {status} ({progress}%)")
            return response
        
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
