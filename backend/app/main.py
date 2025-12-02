"""
Plant Intel Backend - FastAPI Application
Multi-tenant manufacturing analytics platform
"""

import os
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

# Import middleware
from app.middleware import audit_logger

# Import routers (will create these)
from app.routers import (
    health,
    upload,
    analysis,
    mappings,
    chat,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Plant Intel Backend starting up...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")

    # Initialize connections
    # TODO: Initialize database pool, Redis connection, etc.

    yield

    # Shutdown
    logger.info("👋 Plant Intel Backend shutting down...")
    # TODO: Close connections gracefully


# Create FastAPI app
app = FastAPI(
    title="Plant Intel API",
    description="Manufacturing analytics and intelligence platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================================
# CORS Configuration
# ============================================================================
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Request ID Middleware (for tracing)
# ============================================================================
@app.middleware("http")
async def add_trace_id(request: Request, call_next):
    """Add trace ID to all requests for logging correlation"""
    import uuid
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
    request.state.trace_id = trace_id

    response = await call_next(request)
    response.headers["X-Trace-ID"] = trace_id

    return response


# ============================================================================
# Global Exception Handler
# ============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={"trace_id": getattr(request.state, "trace_id", None)}
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "trace_id": getattr(request.state, "trace_id", None),
        }
    )


# ============================================================================
# Health Check
# ============================================================================
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "plant-intel-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Plant Intel API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ============================================================================
# Include Routers
# ============================================================================
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(analysis.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(mappings.router, prefix="/api/v1", tags=["Mappings"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
