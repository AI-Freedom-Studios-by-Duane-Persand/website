"""
Async generation tasks for Celery worker.
Handles long-running video and image generation with webhook callbacks.
"""

import httpx
import logging
from celery import Task
from tasks.celery_app import celery_app
from providers.poe_provider import PoeProvider

logger = logging.getLogger(__name__)


class CallbackTask(Task):
    """Base task with webhook callback support"""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Send success webhook when task completes"""
        webhook_url = kwargs.get('webhook_url')
        if webhook_url:
            self.send_webhook(webhook_url, {
                'job_id': task_id,
                'status': 'completed',
                'result': retval
            })
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Send failure webhook when task fails"""
        webhook_url = kwargs.get('webhook_url')
        if webhook_url:
            self.send_webhook(webhook_url, {
                'job_id': task_id,
                'status': 'failed',
                'error': str(exc)
            })
    
    def send_webhook(self, url: str, data: dict):
        """
        Send HTTP POST to webhook URL.
        
        Args:
            url: Webhook URL
            data: Payload to send
        """
        try:
            logger.info(f"Sending webhook to {url}")
            httpx.post(url, json=data, timeout=10)
        except Exception as e:
            logger.error(f"Webhook failed for {url}: {str(e)}")


@celery_app.task(bind=True, base=CallbackTask, max_retries=3, queue='video')
def generate_video_async(self, request_data: dict, webhook_url: str = None):
    """
    Long-running video generation task with progress tracking.
    
    Args:
        request_data: Video generation request parameters
        webhook_url: Optional webhook for completion callback
    
    Returns:
        Dict with video URL and metadata
    
    Example:
        task = generate_video_async.delay(
            {
                'prompt': 'A cinematic shot of mountains',
                'model': 'sora-2',
                'duration_seconds': 8,
                'tenant_id': 'tenant_123'
            },
            webhook_url='https://myapp.com/webhooks/video-complete'
        )
    """
    provider = PoeProvider()
    
    # Update task state for progress tracking
    self.update_state(state='PROCESSING', meta={'progress': 10})
    
    try:
        logger.info(f"Starting video generation: {request_data['prompt'][:50]}...")
        
        # Call Poe API for video generation
        result = await provider.generate_video(
            prompt=request_data['prompt'],
            model=request_data['model'],
            duration_seconds=request_data.get('duration_seconds', 8),
            aspect_ratio=request_data.get('aspect_ratio', '16:9'),
            tenant_id=request_data.get('tenant_id'),
        )
        
        # Update progress
        self.update_state(state='PROCESSING', meta={'progress': 90})
        
        logger.info(f"Video generation completed: {result}")
        
        return {
            'url': result.get('url'),
            'duration': result.get('duration'),
            'model': result.get('model'),
            'prompt': request_data['prompt']
        }
    
    except Exception as exc:
        logger.error(f"Video generation failed: {str(exc)}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True, base=CallbackTask, max_retries=2, queue='images')
def generate_image_async(self, request_data: dict, webhook_url: str = None):
    """
    Async image generation task (for batch processing).
    
    Args:
        request_data: Image generation request parameters
        webhook_url: Optional webhook for completion callback
    
    Returns:
        Dict with image URL
    
    Example:
        task = generate_image_async.delay(
            {
                'prompt': 'A serene mountain landscape',
                'model': 'dall-e-3',
                'resolution': '1024x1024',
                'tenant_id': 'tenant_123'
            }
        )
    """
    provider = PoeProvider()
    
    try:
        logger.info(f"Starting image generation: {request_data['prompt'][:50]}...")
        
        self.update_state(state='PROCESSING', meta={'progress': 50})
        
        result = provider.generate_image(
            prompt=request_data['prompt'],
            model=request_data['model'],
            resolution=request_data.get('resolution', '1024x1024'),
            style=request_data.get('style'),
            tenant_id=request_data.get('tenant_id'),
        )
        
        logger.info(f"Image generation completed: {result}")
        
        return {
            'url': result,
            'model': request_data['model'],
            'resolution': request_data.get('resolution', '1024x1024'),
        }
    
    except Exception as exc:
        logger.error(f"Image generation failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=20)
