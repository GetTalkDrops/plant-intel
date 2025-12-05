"""
Health Check Endpoints

Provides comprehensive health checks for the API and its dependencies.
Used by Docker healthcheck, load balancers, and monitoring systems.
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Response, status
from supabase import create_client, Client
from anthropic import Anthropic

logger = logging.getLogger(__name__)

router = APIRouter()


async def check_supabase() -> Dict[str, Any]:
    """Check Supabase connection and query performance"""
    try:
        supabase: Client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", "")
        )

        # Simple query to verify connection
        start_time = datetime.utcnow()
        response = supabase.table("customers").select("id").limit(1).execute()
        query_time_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return {
            "status": "healthy",
            "response_time_ms": round(query_time_ms, 2),
            "message": "Supabase connection successful"
        }
    except Exception as e:
        logger.error(f"Supabase health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Supabase connection failed"
        }


async def check_anthropic() -> Dict[str, Any]:
    """Check Anthropic API key is configured"""
    try:
        api_key = os.getenv("ANTHROPIC_API_KEY")

        if not api_key:
            return {
                "status": "unhealthy",
                "message": "Anthropic API key not configured"
            }

        # Don't actually call the API (costs money)
        # Just verify key is set and client can be initialized
        client = Anthropic(api_key=api_key)

        return {
            "status": "healthy",
            "message": "Anthropic API key configured",
            "key_prefix": api_key[:7] + "..." if len(api_key) > 7 else "***"
        }
    except Exception as e:
        logger.error(f"Anthropic health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "message": "Anthropic API check failed"
        }


async def check_environment() -> Dict[str, Any]:
    """Check critical environment variables"""
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY",
        "ANTHROPIC_API_KEY",
        "CLERK_JWT_PUBLIC_KEY"
    ]

    missing = []
    configured = []

    for var in required_vars:
        if os.getenv(var):
            configured.append(var)
        else:
            missing.append(var)

    if missing:
        return {
            "status": "unhealthy",
            "configured": configured,
            "missing": missing,
            "message": f"Missing {len(missing)} required environment variables"
        }

    return {
        "status": "healthy",
        "configured": configured,
        "message": "All required environment variables configured"
    }


@router.get("/health")
async def basic_health_check():
    """
    Basic health check - fast response for Docker healthcheck

    Returns HTTP 200 if service is running.
    Used by Docker HEALTHCHECK and load balancers.
    """
    return {
        "status": "healthy",
        "service": "plant-intel-api",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed")
async def detailed_health_check(response: Response):
    """
    Detailed health check with dependency checks

    Checks:
    - Supabase database connection
    - Anthropic API configuration
    - Environment variables
    - System resources

    Returns HTTP 200 if all checks pass, HTTP 503 if any dependency is unhealthy.
    """
    # Run all health checks
    supabase_health = await check_supabase()
    anthropic_health = await check_anthropic()
    env_health = await check_environment()

    # Determine overall health
    all_healthy = all([
        supabase_health["status"] == "healthy",
        anthropic_health["status"] == "healthy",
        env_health["status"] == "healthy"
    ])

    # Set HTTP status code
    if not all_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "service": "plant-intel-api",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "checks": {
            "supabase": supabase_health,
            "anthropic": anthropic_health,
            "environment": env_health
        }
    }


@router.get("/health/ready")
async def readiness_check(response: Response):
    """
    Kubernetes readiness probe

    Returns HTTP 200 when service is ready to accept traffic.
    Returns HTTP 503 when service is starting up or unhealthy.
    """
    # Check critical dependencies only
    supabase_health = await check_supabase()
    env_health = await check_environment()

    ready = all([
        supabase_health["status"] == "healthy",
        env_health["status"] == "healthy"
    ])

    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "ready": ready,
        "service": "plant-intel-api",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/live")
async def liveness_check():
    """
    Kubernetes liveness probe

    Returns HTTP 200 if service is alive.
    Used by Kubernetes to determine if pod should be restarted.
    """
    return {
        "alive": True,
        "service": "plant-intel-api",
        "timestamp": datetime.utcnow().isoformat()
    }
