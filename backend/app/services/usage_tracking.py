"""
Usage Tracking Service

Tracks API usage for billing and quota enforcement.
Multi-tenant with org_id isolation.
"""

import logging
from typing import Optional
from datetime import datetime, timedelta
from supabase import Client
import os
from supabase import create_client

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)


# ============================================================================
# Usage Event Types
# ============================================================================

class UsageEventType:
    """Standard usage event types for tracking"""
    # File operations
    CSV_UPLOAD = "csv_upload"
    CSV_ROW_PROCESSED = "csv_row_processed"

    # Analysis
    ANALYSIS_RUN = "analysis_run"
    ANALYZER_EXECUTION = "analyzer_execution"

    # AI Chat
    CHAT_MESSAGE = "chat_message"
    AI_TOKENS_INPUT = "ai_tokens_input"
    AI_TOKENS_OUTPUT = "ai_tokens_output"

    # Mapping
    MAPPING_PROFILE_CREATED = "mapping_profile_created"
    MAPPING_PROFILE_USED = "mapping_profile_used"

    # Export
    EXPORT_PDF = "export_pdf"
    EXPORT_CSV = "export_csv"


# ============================================================================
# Usage Limits by Tier
# ============================================================================

USAGE_LIMITS = {
    "trial": {
        "csv_uploads_per_month": 5,
        "csv_rows_per_month": 1000,
        "analyses_per_month": 10,
        "chat_messages_per_month": 50,
        "ai_tokens_per_month": 100000,  # ~100k tokens
        "mapping_profiles": 3,
    },
    "pilot": {
        "csv_uploads_per_month": 50,
        "csv_rows_per_month": 50000,
        "analyses_per_month": 100,
        "chat_messages_per_month": 500,
        "ai_tokens_per_month": 1000000,  # ~1M tokens
        "mapping_profiles": 20,
    },
    "subscription": {
        "csv_uploads_per_month": -1,  # Unlimited
        "csv_rows_per_month": -1,
        "analyses_per_month": -1,
        "chat_messages_per_month": -1,
        "ai_tokens_per_month": -1,
        "mapping_profiles": -1,
    }
}


# ============================================================================
# Usage Tracking Functions
# ============================================================================

async def track_usage_event(
    org_id: str,
    event_type: str,
    quantity: int = 1,
    metadata: Optional[dict] = None
) -> None:
    """
    Track a usage event for billing and quota enforcement

    Args:
        org_id: Organization ID
        event_type: Type of usage event (see UsageEventType)
        quantity: Number of units consumed (default: 1)
        metadata: Optional metadata about the event
    """
    try:
        # Insert usage event
        event = {
            "org_id": org_id,
            "event_type": event_type,
            "quantity": quantity,
            "metadata": metadata or {},
            "created_at": datetime.utcnow().isoformat(),
        }

        supabase.table("usage_events").insert(event).execute()

        logger.debug(f"Tracked usage event: {event_type} for org {org_id}, quantity: {quantity}")

    except Exception as e:
        # Don't fail the request if usage tracking fails
        logger.error(f"Failed to track usage event: {str(e)}", exc_info=True)


async def check_usage_limit(
    org_id: str,
    event_type: str,
    tier: str = "pilot"
) -> tuple[bool, int, int]:
    """
    Check if organization has reached usage limits

    Args:
        org_id: Organization ID
        event_type: Type of usage event to check
        tier: Organization tier (trial, pilot, subscription)

    Returns:
        Tuple of (within_limit, current_usage, limit)
    """
    try:
        # Get limit for this tier and event type
        limits = USAGE_LIMITS.get(tier, USAGE_LIMITS["pilot"])

        # Map event type to limit key
        limit_key_map = {
            UsageEventType.CSV_UPLOAD: "csv_uploads_per_month",
            UsageEventType.CSV_ROW_PROCESSED: "csv_rows_per_month",
            UsageEventType.ANALYSIS_RUN: "analyses_per_month",
            UsageEventType.CHAT_MESSAGE: "chat_messages_per_month",
            UsageEventType.AI_TOKENS_INPUT: "ai_tokens_per_month",
            UsageEventType.AI_TOKENS_OUTPUT: "ai_tokens_per_month",
            UsageEventType.MAPPING_PROFILE_CREATED: "mapping_profiles",
        }

        limit_key = limit_key_map.get(event_type)
        if not limit_key:
            # No limit defined for this event type
            return True, 0, -1

        limit = limits.get(limit_key, -1)

        # -1 means unlimited
        if limit == -1:
            return True, 0, -1

        # Get current month's usage
        start_of_month = datetime.utcnow().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )

        # Query usage events for this month
        response = supabase.table("usage_events") \
            .select("quantity", count="exact") \
            .eq("org_id", org_id) \
            .eq("event_type", event_type) \
            .gte("created_at", start_of_month.isoformat()) \
            .execute()

        # Calculate total usage
        current_usage = sum(event.get("quantity", 1) for event in response.data)

        # Check if within limit
        within_limit = current_usage < limit

        logger.debug(f"Usage check for {org_id} ({tier}): {event_type} = {current_usage}/{limit}")

        return within_limit, current_usage, limit

    except Exception as e:
        logger.error(f"Failed to check usage limit: {str(e)}", exc_info=True)
        # Default to allowing the operation if check fails
        return True, 0, -1


async def get_usage_summary(
    org_id: str,
    days: int = 30
) -> dict:
    """
    Get usage summary for an organization

    Args:
        org_id: Organization ID
        days: Number of days to look back (default: 30)

    Returns:
        Dictionary with usage statistics by event type
    """
    try:
        # Calculate start date
        start_date = datetime.utcnow() - timedelta(days=days)

        # Query all usage events for this period
        response = supabase.table("usage_events") \
            .select("*") \
            .eq("org_id", org_id) \
            .gte("created_at", start_date.isoformat()) \
            .execute()

        events = response.data or []

        # Aggregate by event type
        summary = {}
        for event in events:
            event_type = event["event_type"]
            quantity = event.get("quantity", 1)

            if event_type not in summary:
                summary[event_type] = {
                    "count": 0,
                    "total_quantity": 0,
                    "first_event": event["created_at"],
                    "last_event": event["created_at"],
                }

            summary[event_type]["count"] += 1
            summary[event_type]["total_quantity"] += quantity
            summary[event_type]["last_event"] = max(
                summary[event_type]["last_event"],
                event["created_at"]
            )

        logger.info(f"Usage summary for org {org_id}: {len(events)} events, {len(summary)} types")

        return {
            "org_id": org_id,
            "period_days": days,
            "total_events": len(events),
            "summary_by_type": summary,
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get usage summary: {str(e)}", exc_info=True)
        return {
            "org_id": org_id,
            "error": str(e),
            "generated_at": datetime.utcnow().isoformat(),
        }
