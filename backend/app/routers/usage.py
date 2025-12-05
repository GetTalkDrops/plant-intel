"""
Usage Tracking Endpoints

Provides usage statistics and quota information for organizations.
"""

import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends, Query

from app.middleware import get_current_user
from app.services.usage_tracking import (
    get_usage_summary,
    check_usage_limit,
    UsageEventType,
    USAGE_LIMITS
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/usage/summary")
async def get_organization_usage_summary(
    request: Request,
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    user: dict = Depends(get_current_user)
):
    """
    Get usage summary for the current organization

    Returns aggregated usage statistics for the specified period.
    Multi-tenant: Filtered by org_id from JWT token.
    """
    try:
        org_id = user["org_id"]

        logger.info(f"Fetching usage summary for org {org_id}, last {days} days")

        summary = await get_usage_summary(org_id=org_id, days=days)

        return summary

    except Exception as e:
        logger.error(f"Failed to get usage summary: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get usage summary: {str(e)}"
        )


@router.get("/usage/limits")
async def get_organization_usage_limits(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """
    Get usage limits and current usage for the organization

    Returns quota limits based on organization tier and current usage.
    Multi-tenant: Filtered by org_id from JWT token.
    """
    try:
        org_id = user["org_id"]

        logger.info(f"Fetching usage limits for org {org_id}")

        # TODO: Get tier from customers table
        # For now, default to 'pilot'
        tier = "pilot"

        # Get limits for this tier
        limits = USAGE_LIMITS.get(tier, USAGE_LIMITS["pilot"])

        # Check current usage for each limit type
        usage_checks = {}

        # CSV uploads
        within_limit, current, limit = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.CSV_UPLOAD,
            tier=tier
        )
        usage_checks["csv_uploads"] = {
            "current": current,
            "limit": limit,
            "within_limit": within_limit,
            "unit": "uploads"
        }

        # CSV rows
        within_limit, current, limit = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.CSV_ROW_PROCESSED,
            tier=tier
        )
        usage_checks["csv_rows"] = {
            "current": current,
            "limit": limit,
            "within_limit": within_limit,
            "unit": "rows"
        }

        # Analyses
        within_limit, current, limit = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.ANALYSIS_RUN,
            tier=tier
        )
        usage_checks["analyses"] = {
            "current": current,
            "limit": limit,
            "within_limit": within_limit,
            "unit": "analyses"
        }

        # Chat messages
        within_limit, current, limit = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.CHAT_MESSAGE,
            tier=tier
        )
        usage_checks["chat_messages"] = {
            "current": current,
            "limit": limit,
            "within_limit": within_limit,
            "unit": "messages"
        }

        # AI tokens (combined input + output)
        within_limit_in, current_in, limit_in = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.AI_TOKENS_INPUT,
            tier=tier
        )
        within_limit_out, current_out, limit_out = await check_usage_limit(
            org_id=org_id,
            event_type=UsageEventType.AI_TOKENS_OUTPUT,
            tier=tier
        )

        total_tokens = current_in + current_out
        usage_checks["ai_tokens"] = {
            "current": total_tokens,
            "limit": limit_in if limit_in != -1 else -1,
            "within_limit": within_limit_in and within_limit_out,
            "unit": "tokens",
            "breakdown": {
                "input_tokens": current_in,
                "output_tokens": current_out
            }
        }

        logger.info(f"Usage limits for org {org_id} ({tier}): {len(usage_checks)} metrics")

        return {
            "org_id": org_id,
            "tier": tier,
            "limits": usage_checks,
            "period": "current_month"
        }

    except Exception as e:
        logger.error(f"Failed to get usage limits: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get usage limits: {str(e)}"
        )


@router.get("/usage/quota-status")
async def get_quota_status(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """
    Quick quota status check

    Returns a simple status indicating if organization is approaching or exceeding limits.
    Multi-tenant: Filtered by org_id from JWT token.
    """
    try:
        org_id = user["org_id"]

        logger.info(f"Checking quota status for org {org_id}")

        # TODO: Get tier from customers table
        tier = "pilot"

        # Check key metrics
        checks = [
            await check_usage_limit(org_id, UsageEventType.CSV_UPLOAD, tier),
            await check_usage_limit(org_id, UsageEventType.ANALYSIS_RUN, tier),
            await check_usage_limit(org_id, UsageEventType.CHAT_MESSAGE, tier),
        ]

        # Determine overall status
        any_over_limit = any(not within for within, _, _ in checks)
        any_approaching_limit = any(
            current > limit * 0.8 and limit != -1
            for within, current, limit in checks
        )

        if any_over_limit:
            status = "over_limit"
            message = "You have exceeded one or more usage limits"
        elif any_approaching_limit:
            status = "approaching_limit"
            message = "You are approaching usage limits (>80%)"
        else:
            status = "ok"
            message = "Usage is within limits"

        return {
            "org_id": org_id,
            "tier": tier,
            "status": status,
            "message": message
        }

    except Exception as e:
        logger.error(f"Failed to check quota status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check quota status: {str(e)}"
        )
