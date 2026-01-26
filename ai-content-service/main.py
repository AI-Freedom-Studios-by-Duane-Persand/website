"""
AI Content Generation Microservice
FastAPI application for text, image, and video generation with tenant isolation.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Content Generation Service",
    description="Microservice for text, image, and video generation with tenant isolation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register route modules
from routes import text, images, videos, jobs

app.include_router(text.router)
app.include_router(images.router)
app.include_router(videos.router)
app.include_router(jobs.router)


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("AI Content Generation Service starting up...")
    logger.info(f"Environment: {os.getenv('ENV', 'development')}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("AI Content Generation Service shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Content Generation Service",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-content-service",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENV") == "development",
        log_level="info"
    )
