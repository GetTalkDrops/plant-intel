"""
Analysis Endpoints
"""

import logging
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel

from app.middleware import get_current_user, audit_logger
from app.orchestrators.auto_analysis_orchestrator import AutoAnalysisOrchestrator
from app.services.analysis_service import AnalysisService

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = AutoAnalysisOrchestrator()
analysis_service = AnalysisService()


class AnalysisRequest(BaseModel):
    """Analysis request payload"""
    batch_id: str
    csv_headers: list[str]
    config: Optional[Dict[str, Any]] = None
    data_tier: Optional[int] = None


@router.post("/analyze/auto")
async def auto_analyze(
    request: Request,
    analysis_request: AnalysisRequest,
    user: dict = Depends(get_current_user)
):
    """
    Run comprehensive auto-analysis using the orchestrator

    Multi-tenant: Uses org_id from JWT token
    Triggers all appropriate analyzers based on data tier
    """
    try:
        org_id = user["org_id"]
        user_id = user["user_id"]
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
            # Save analysis to database
            analysis_id = analysis_service.save_analysis(
                org_id=org_id,
                user_id=user_id,
                batch_id=analysis_request.batch_id,
                data_tier=result.get('data_tier', 'Unknown'),
                analyzers_run=result.get('analyzers_run', []),
                insights=result.get('insights', {}),
                execution_time_ms=execution_time_ms
            )

            # Log to audit trail
            await audit_logger.log_analysis_run(
                user_id=user_id,
                org_id=org_id,
                analysis_id=analysis_id or 'unknown',
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
                "analysis_id": analysis_id,
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
async def get_analysis_results(
    analysis_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get analysis results by ID

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user["org_id"]

        # Query analysis from database
        analysis = analysis_service.get_analysis(analysis_id, org_id)

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis {analysis_id} not found or access denied"
            )

        return {
            "success": True,
            **analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch analysis results: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to fetch analysis results: {str(e)}'
        )


@router.get("/analyze/list")
async def list_analyses(
    limit: int = 20,
    offset: int = 0,
    user: dict = Depends(get_current_user)
):
    """
    List analyses for the user's organization

    Multi-tenant: Automatically filtered by org_id via RLS
    """
    try:
        org_id = user["org_id"]

        # Query analyses from database
        result = analysis_service.list_analyses(
            org_id=org_id,
            limit=limit,
            offset=offset
        )

        return {
            "success": True,
            "org_id": org_id,
            **result
        }

    except Exception as e:
        logger.error(f"Failed to list analyses: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f'Failed to list analyses: {str(e)}'
        )
