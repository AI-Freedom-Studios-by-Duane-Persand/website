"""
Celery configuration for async task processing.
Handles video and image generation as background jobs.
"""

import os
from celery import Celery

# Create Celery app
celery_app = Celery(
    "ai_content_service",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0")
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,  # Results expire after 1 hour
    task_track_started=True,
    task_time_limit=600,  # 10 minutes hard limit
    task_soft_time_limit=540,  # 9 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Task routing
celery_app.conf.task_routes = {
    'tasks.generation_tasks.generate_video_async': {'queue': 'video'},
    'tasks.generation_tasks.generate_image_async': {'queue': 'images'},
}

# Task time limits
celery_app.conf.task_time_limits = {
    'tasks.generation_tasks.generate_video_async': (600, 540),  # 10min hard, 9min soft
    'tasks.generation_tasks.generate_image_async': (300, 270),  # 5min hard, 4.5min soft
}
