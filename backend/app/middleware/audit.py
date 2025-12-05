"""
Audit Logging System
Immutable logging for compliance and security
"""

import os
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import uuid4

from supabase import create_client, Client

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Audit logging system with immutable logs

    All actions are logged to audit_logs table with:
    - timestamp
    - action type
    - user_id
    - org_id
    - resource_type and resource_id
    - details (JSON)
    - trace_id (for request tracing)

    CRITICAL: Logs are immutable - no updates or deletes allowed
    """

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not set - audit logging will fail")
            self.supabase = None
        else:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
            except Exception as e:
                logger.warning(f"Failed to create Supabase client for audit logging: {e}")
                self.supabase = None

    async def log(
        self,
        action: str,
        user_id: str,
        org_id: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> bool:
        """
        Log an action to the audit log

        Args:
            action: Action name (e.g., "csv_uploaded", "map_created", "analysis_run")
            user_id: User who performed the action
            org_id: Organization ID (CRITICAL for multi-tenancy)
            resource_type: Type of resource (e.g., "mapping_profile", "analysis")
            resource_id: ID of the resource (optional)
            details: Additional details as JSON-serializable dict
            trace_id: Request trace ID for correlation
            ip_address: Client IP address
            user_agent: Client user agent

        Returns:
            True if log was successful, False otherwise
        """
        if not self.supabase:
            logger.error("Supabase client not initialized - cannot log audit entry")
            return False

        try:
            # Generate trace_id if not provided
            if not trace_id:
                trace_id = str(uuid4())

            # Create audit log entry
            log_entry = {
                "id": str(uuid4()),
                "timestamp": datetime.utcnow().isoformat(),
                "action": action,
                "user_id": user_id,
                "org_id": org_id,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "details": json.dumps(details) if details else None,
                "trace_id": trace_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
            }

            # Insert into audit_logs table
            result = self.supabase.table("audit_logs").insert(log_entry).execute()

            logger.info(
                f"Audit log created: {action} by {user_id} (org: {org_id})",
                extra={
                    "action": action,
                    "user_id": user_id,
                    "org_id": org_id,
                    "trace_id": trace_id,
                },
            )

            return True

        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}", exc_info=True)
            return False

    async def log_csv_upload(
        self,
        user_id: str,
        org_id: str,
        batch_id: str,
        filename: str,
        row_count: int,
        file_size_bytes: int,
        trace_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> bool:
        """Log CSV upload event"""
        return await self.log(
            action="csv_uploaded",
            user_id=user_id,
            org_id=org_id,
            resource_type="csv_upload",
            resource_id=batch_id,
            details={
                "filename": filename,
                "row_count": row_count,
                "file_size_bytes": file_size_bytes,
            },
            trace_id=trace_id,
            ip_address=ip_address,
        )

    async def log_map_created(
        self,
        user_id: str,
        org_id: str,
        map_id: str,
        map_name: str,
        field_count: int,
        trace_id: Optional[str] = None,
    ) -> bool:
        """Log mapping profile creation"""
        return await self.log(
            action="map_created",
            user_id=user_id,
            org_id=org_id,
            resource_type="mapping_profile",
            resource_id=map_id,
            details={
                "map_name": map_name,
                "field_count": field_count,
            },
            trace_id=trace_id,
        )

    async def log_map_updated(
        self,
        user_id: str,
        org_id: str,
        map_id: str,
        changes: Dict[str, Any],
        trace_id: Optional[str] = None,
    ) -> bool:
        """Log mapping profile update"""
        return await self.log(
            action="map_updated",
            user_id=user_id,
            org_id=org_id,
            resource_type="mapping_profile",
            resource_id=map_id,
            details={"changes": changes},
            trace_id=trace_id,
        )

    async def log_analysis_run(
        self,
        user_id: str,
        org_id: str,
        analysis_id: str,
        batch_id: str,
        data_tier: str,
        analyzers_run: list,
        total_insights: int,
        execution_time_ms: int,
        trace_id: Optional[str] = None,
    ) -> bool:
        """Log analysis execution"""
        return await self.log(
            action="analysis_run",
            user_id=user_id,
            org_id=org_id,
            resource_type="analysis",
            resource_id=analysis_id,
            details={
                "batch_id": batch_id,
                "data_tier": data_tier,
                "analyzers_run": analyzers_run,
                "total_insights": total_insights,
                "execution_time_ms": execution_time_ms,
            },
            trace_id=trace_id,
        )

    async def log_config_updated(
        self,
        user_id: str,
        org_id: str,
        config_type: str,
        changes: Dict[str, Any],
        trace_id: Optional[str] = None,
    ) -> bool:
        """Log configuration change"""
        return await self.log(
            action="config_updated",
            user_id=user_id,
            org_id=org_id,
            resource_type="analyzer_config",
            details={
                "config_type": config_type,
                "changes": changes,
            },
            trace_id=trace_id,
        )

    async def log_subscription_event(
        self,
        user_id: str,
        org_id: str,
        event_type: str,
        subscription_id: str,
        details: Dict[str, Any],
        trace_id: Optional[str] = None,
    ) -> bool:
        """Log subscription event (created, updated, canceled, etc.)"""
        return await self.log(
            action=f"subscription_{event_type}",
            user_id=user_id,
            org_id=org_id,
            resource_type="subscription",
            resource_id=subscription_id,
            details=details,
            trace_id=trace_id,
        )

    async def log_access_denied(
        self,
        user_id: str,
        org_id: str,
        resource_type: str,
        resource_id: str,
        reason: str,
        trace_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> bool:
        """Log access denied event (security)"""
        return await self.log(
            action="access_denied",
            user_id=user_id,
            org_id=org_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details={"reason": reason},
            trace_id=trace_id,
            ip_address=ip_address,
        )

    async def query_logs(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> list:
        """
        Query audit logs with filters

        Args:
            org_id: Organization ID (required for multi-tenancy)
            user_id: Filter by user (optional)
            action: Filter by action type (optional)
            resource_type: Filter by resource type (optional)
            start_date: Filter by start date ISO format (optional)
            end_date: Filter by end date ISO format (optional)
            limit: Max results to return (default 100)

        Returns:
            List of audit log entries
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return []

        try:
            query = self.supabase.table("audit_logs").select("*")

            # CRITICAL: Always filter by org_id for multi-tenancy
            query = query.eq("org_id", org_id)

            if user_id:
                query = query.eq("user_id", user_id)

            if action:
                query = query.eq("action", action)

            if resource_type:
                query = query.eq("resource_type", resource_type)

            if start_date:
                query = query.gte("timestamp", start_date)

            if end_date:
                query = query.lte("timestamp", end_date)

            # Order by timestamp descending
            query = query.order("timestamp", desc=True).limit(limit)

            result = query.execute()

            return result.data if result.data else []

        except Exception as e:
            logger.error(f"Failed to query audit logs: {str(e)}", exc_info=True)
            return []


# Global audit logger instance
audit_logger = AuditLogger()


class StructuredLogger:
    """
    Structured logging with JSON output for observability

    Use this for application logging (not audit trails)
    """

    @staticmethod
    def log(
        level: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        """Log structured message with context"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level.upper(),
            "message": message,
            "trace_id": trace_id or str(uuid4()),
        }

        if context:
            log_data["context"] = context

        # In production, this would go to a logging service (Datadog, CloudWatch, etc.)
        logger.log(
            getattr(logging, level.upper()),
            json.dumps(log_data),
        )

    @staticmethod
    def info(message: str, context: Optional[Dict[str, Any]] = None, trace_id: Optional[str] = None):
        StructuredLogger.log("info", message, context, trace_id)

    @staticmethod
    def warning(message: str, context: Optional[Dict[str, Any]] = None, trace_id: Optional[str] = None):
        StructuredLogger.log("warning", message, context, trace_id)

    @staticmethod
    def error(message: str, context: Optional[Dict[str, Any]] = None, trace_id: Optional[str] = None):
        StructuredLogger.log("error", message, context, trace_id)
