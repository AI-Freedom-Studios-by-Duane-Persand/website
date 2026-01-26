"""
Job status and management routes for AI content service.
Handles GET /v1/jobs/{job_id} for tracking async generation jobs.
"""

from fastapi import APIRouter, HTTPException, Request
import logging
from models.responses import JobStatusResponse, ErrorResponse
from providers.poe_provider import PoeProvider
from middleware.tenant_isolation import enforce_tenant_isolation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["jobs"])
provider = PoeProvider()


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    responses={
        404: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    }
)
async def get_job_status(job_id: str, http_request: Request):
    """
    Get status of an async generation job.
    
    Returns job status and progress percentage.
    For completed jobs, returns the result data.
    For failed jobs, returns error message.
    
    Status values:
    - pending: Job queued, waiting to start
    - processing: Job actively generating content
    - completed: Generation successful, result available
    - failed: Generation failed with error
    
    Example:
        GET /v1/jobs/550e8400-e29b-41d4-a716-446655440000
    
    Response:
        {
            "job_id": "550e8400-e29b-41d4-a716-446655440000",
            "status": "processing",
            "progress": 45,
            "result": null,
            "error": null
        }
    """
    try:
        logger.info(f"Checking status of job {job_id}")
        
        # Get job status from provider
        status_info = await provider.get_job_status(job_id)
        
        logger.info(
            f"Job {job_id} status: {status_info.get('status')}, "
            f"progress: {status_info.get('progress')}%"
        )
        
        return JobStatusResponse(
            job_id=job_id,
            status=status_info.get("status", "unknown"),
            progress=status_info.get("progress", 0),
            result=status_info.get("result"),
            error=status_info.get("error"),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status for {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "job-management"}
