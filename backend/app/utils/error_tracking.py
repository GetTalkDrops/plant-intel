"""
Error Tracking and Alerting Utilities

Provides structured error tracking, categorization, and alert generation.
Foundation for integration with external services like Sentry, DataDog, etc.
"""

import logging
import os
import traceback
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


# ============================================================================
# Error Severity Levels
# ============================================================================

class ErrorSeverity(str, Enum):
    """Error severity levels for tracking and alerting"""
    LOW = "low"                  # Minor issues, degraded functionality
    MEDIUM = "medium"            # Significant issues, user impact
    HIGH = "high"                # Critical issues, service degradation
    CRITICAL = "critical"        # System-wide failures, data loss risk


class ErrorCategory(str, Enum):
    """Error categories for tracking and analysis"""
    # Infrastructure
    DATABASE = "database"
    EXTERNAL_API = "external_api"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"

    # Application
    VALIDATION = "validation"
    BUSINESS_LOGIC = "business_logic"
    DATA_PROCESSING = "data_processing"
    FILE_PROCESSING = "file_processing"

    # AI/ML
    AI_SERVICE = "ai_service"
    ANALYSIS = "analysis"

    # System
    CONFIGURATION = "configuration"
    DEPENDENCY = "dependency"
    UNKNOWN = "unknown"


# ============================================================================
# Error Tracking
# ============================================================================

def track_error(
    error: Exception,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None,
    request_id: Optional[str] = None,
) -> str:
    """
    Track an error with structured metadata

    Args:
        error: The exception object
        category: Error category for classification
        severity: Severity level
        context: Additional context (function, data, etc.)
        user_id: User ID if applicable
        org_id: Organization ID if applicable
        request_id: Request ID for tracing

    Returns:
        Error ID for reference
    """
    error_id = f"err_{datetime.utcnow().timestamp()}"

    # Build error metadata
    error_data = {
        "error_id": error_id,
        "timestamp": datetime.utcnow().isoformat(),
        "error_type": type(error).__name__,
        "error_message": str(error),
        "category": category.value,
        "severity": severity.value,
        "traceback": traceback.format_exc(),
    }

    # Add context
    if context:
        error_data["context"] = context
    if user_id:
        error_data["user_id"] = user_id
    if org_id:
        error_data["org_id"] = org_id
    if request_id:
        error_data["request_id"] = request_id

    # Log with appropriate level
    log_level = _get_log_level(severity)
    logger.log(
        log_level,
        f"[{severity.value.upper()}] {category.value}: {str(error)}",
        extra=error_data,
        exc_info=True
    )

    # Send alerts for high/critical errors
    if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
        _send_alert(error_data)

    return error_id


def track_business_error(
    message: str,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None,
) -> str:
    """
    Track a business logic error (not an exception)

    Used for tracking issues like:
    - Data validation failures
    - Business rule violations
    - Quota limit exceeded
    - Configuration errors

    Args:
        message: Error message
        category: Error category
        severity: Severity level
        context: Additional context
        user_id: User ID if applicable
        org_id: Organization ID if applicable

    Returns:
        Error ID for reference
    """
    error_id = f"biz_{datetime.utcnow().timestamp()}"

    error_data = {
        "error_id": error_id,
        "timestamp": datetime.utcnow().isoformat(),
        "error_type": "BusinessError",
        "error_message": message,
        "category": category.value,
        "severity": severity.value,
    }

    if context:
        error_data["context"] = context
    if user_id:
        error_data["user_id"] = user_id
    if org_id:
        error_data["org_id"] = org_id

    log_level = _get_log_level(severity)
    logger.log(
        log_level,
        f"[{severity.value.upper()}] Business Error - {category.value}: {message}",
        extra=error_data
    )

    if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
        _send_alert(error_data)

    return error_id


# ============================================================================
# Error Analysis Helpers
# ============================================================================

def categorize_exception(error: Exception) -> ErrorCategory:
    """
    Automatically categorize an exception based on its type

    Args:
        error: The exception to categorize

    Returns:
        Best-guess error category
    """
    error_type = type(error).__name__
    error_message = str(error).lower()

    # Database errors
    if "database" in error_message or "sql" in error_message:
        return ErrorCategory.DATABASE

    # Authentication/Authorization
    if "auth" in error_message or "token" in error_message or "permission" in error_message:
        if "permission" in error_message or "forbidden" in error_message:
            return ErrorCategory.AUTHORIZATION
        return ErrorCategory.AUTHENTICATION

    # Validation errors
    if "validation" in error_message or error_type == "ValidationError":
        return ErrorCategory.VALIDATION

    # External API errors
    if "api" in error_message or "request" in error_message or "connection" in error_message:
        return ErrorCategory.EXTERNAL_API

    # File processing
    if "file" in error_message or "csv" in error_message or "upload" in error_message:
        return ErrorCategory.FILE_PROCESSING

    # AI service
    if "anthropic" in error_message or "claude" in error_message or "ai" in error_message:
        return ErrorCategory.AI_SERVICE

    return ErrorCategory.UNKNOWN


def determine_severity(error: Exception) -> ErrorSeverity:
    """
    Automatically determine error severity based on exception type

    Args:
        error: The exception to analyze

    Returns:
        Suggested severity level
    """
    error_type = type(error).__name__
    error_message = str(error).lower()

    # Critical errors
    critical_keywords = ["fatal", "critical", "database connection", "corruption"]
    if any(keyword in error_message for keyword in critical_keywords):
        return ErrorSeverity.CRITICAL

    # High severity
    high_keywords = ["failed to connect", "timeout", "unavailable", "service"]
    if any(keyword in error_message for keyword in high_keywords):
        return ErrorSeverity.HIGH

    # Low severity
    low_types = ["ValidationError", "ValueError", "KeyError"]
    if error_type in low_types:
        return ErrorSeverity.LOW

    # Default to medium
    return ErrorSeverity.MEDIUM


# ============================================================================
# Alerting (Foundation for external integrations)
# ============================================================================

def _send_alert(error_data: Dict[str, Any]) -> None:
    """
    Send alert for high/critical errors

    Foundation for integration with:
    - Email alerts
    - Slack notifications
    - PagerDuty
    - Sentry
    - DataDog

    Currently logs to console. Implement external integrations here.
    """
    alert_message = (
        f"🚨 ALERT: {error_data['severity'].upper()} Error\n"
        f"Category: {error_data['category']}\n"
        f"Message: {error_data['error_message']}\n"
        f"Error ID: {error_data['error_id']}\n"
        f"Time: {error_data['timestamp']}"
    )

    if error_data.get("org_id"):
        alert_message += f"\nOrg: {error_data['org_id']}"
    if error_data.get("user_id"):
        alert_message += f"\nUser: {error_data['user_id']}"
    if error_data.get("request_id"):
        alert_message += f"\nRequest: {error_data['request_id']}"

    logger.critical(alert_message, extra={"type": "alert", **error_data})

    # TODO: Implement external alerting
    # Examples:
    # - Send email via SendGrid
    # - Post to Slack webhook
    # - Create PagerDuty incident
    # - Send to Sentry
    # - Send to DataDog


def _get_log_level(severity: ErrorSeverity) -> int:
    """Map error severity to logging level"""
    severity_map = {
        ErrorSeverity.LOW: logging.INFO,
        ErrorSeverity.MEDIUM: logging.WARNING,
        ErrorSeverity.HIGH: logging.ERROR,
        ErrorSeverity.CRITICAL: logging.CRITICAL,
    }
    return severity_map.get(severity, logging.ERROR)


# ============================================================================
# Convenience Functions
# ============================================================================

def track_database_error(error: Exception, **kwargs) -> str:
    """Track a database error"""
    return track_error(
        error,
        category=ErrorCategory.DATABASE,
        severity=ErrorSeverity.HIGH,
        **kwargs
    )


def track_api_error(error: Exception, **kwargs) -> str:
    """Track an external API error"""
    return track_error(
        error,
        category=ErrorCategory.EXTERNAL_API,
        severity=ErrorSeverity.MEDIUM,
        **kwargs
    )


def track_ai_error(error: Exception, **kwargs) -> str:
    """Track an AI service error"""
    return track_error(
        error,
        category=ErrorCategory.AI_SERVICE,
        severity=ErrorSeverity.HIGH,
        **kwargs
    )


def track_validation_error(message: str, **kwargs) -> str:
    """Track a validation error"""
    return track_business_error(
        message,
        category=ErrorCategory.VALIDATION,
        severity=ErrorSeverity.LOW,
        **kwargs
    )


def track_auth_error(error: Exception, **kwargs) -> str:
    """Track an authentication/authorization error"""
    category = ErrorCategory.AUTHORIZATION if "permission" in str(error).lower() else ErrorCategory.AUTHENTICATION
    return track_error(
        error,
        category=category,
        severity=ErrorSeverity.MEDIUM,
        **kwargs
    )
