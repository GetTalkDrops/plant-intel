"""
Analysis Endpoints
"""

import logging
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.middleware import require_auth, audit_logger
from app.orchestrators.auto_analysis_orchestrator import AutoAnalysisOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = AutoAnalysisOrchestrator()


class AnalysisRequest(BaseModel):
    """Analysis request payload"""
    batch_id: str
    csv_headers: list[str]
    config: Optional[Dict[str, Any]] = None
    data_tier: Optional[int] = None


@router.post("/analyze/auto")
@require_auth
async def auto_analyze(
    request: Request,
    user_context: dict,
    analysis_request: AnalysisRequest
):
    """
    Run comprehensive auto-analysis using the orchestrator

    Multi-tenant: Uses org_id from JWT token
    Triggers all appropriate analyzers based on data tier
    """
    try:
        org_id = user_context["org_id"]
        user_id = user_context["user_id"]
        trace_id = getattr(request.state, "trace_id", None)

        # Start timing
        start_time = time.time()

        # Run orchestrator with multi-tenant context
        result = orchestrator.analyze(
            org_id=org_id,  # CRITICAL: From JWT only
            user_id=user_id,
            batch_id=analysis_request.batch_id,
            csv_headers=analysis_request.csv_headers,
            config=analysis_request.config,
            data_tier=analysis_request.data_tier
        )

        # Calculate execution time
        execution_time_ms = int((time.time() - start_time) * 1000)

        if result['success']:
            # Log to audit trail
            await audit_logger.log_analysis_run(
                user_id=user_id,
                org_id=org_id,
                analysis_id=result.get('analysis_id', 'unknown'),
                batch_id=analysis_request.batch_id,
                data_tier=result.get('data_tier', 'unknown'),
                analyzers_run=result.get('analyzers_run', []),
                total_insights=result['insights']['summary'].get('urgent_count', 0) +
                               result['insights']['summary'].get('notable_count', 0),
                execution_time_ms=execution_time_ms,
                trace_id=trace_id
            )

            return {
                "success": True,
                "execution_time_ms": execution_time_ms,
                **result
            }
        else:
            return {
                "success": False,
                "error": result.get('error', 'Analysis failed'),
                "execution_time_ms": execution_time_ms
            }

    except Exception as e:
        logger.error(f"Auto-analysis failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Auto-analysis failed: {str(e)}'
        )


@router.get("/analyze/results/{analysis_id}")
@require_auth
async def get_analysis_results(
    analysis_id: str,
    user_context: dict
):
    """
    Get analysis results by ID

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user_context["org_id"]

        # TODO: Query analyses table filtered by org_id and analysis_id
        # For now, return mock data

        return {
            "success": True,
            "analysis_id": analysis_id,
            "org_id": org_id,
            "message": "Analysis results endpoint - TODO: implement database query"
        }

    except Exception as e:
        logger.error(f"Failed to fetch analysis results: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to fetch analysis results: {str(e)}'
        )


@router.get("/analyze/list")
@require_auth
async def list_analyses(
    user_context: dict,
    limit: int = 20,
    offset: int = 0
):
    """
    List analyses for the user's organization

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user_context["org_id"]

        # TODO: Query analyses table filtered by org_id
        # For now, return empty list

        return {
            "success": True,
            "org_id": org_id,
            "analyses": [],
            "total": 0,
            "limit": limit,
            "offset": offset,
            "message": "List analyses endpoint - TODO: implement database query"
        }

    except Exception as e:
        logger.error(f"Failed to list analyses: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to list analyses: {str(e)}'
        )
