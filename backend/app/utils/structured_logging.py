"""
Structured Logging Utilities

Provides consistent structured logging across the application.
Supports JSON logging for production and human-readable logs for development.
"""

import logging
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from contextvars import ContextVar

# Context variables for request tracking
request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)
org_id_var: ContextVar[Optional[str]] = ContextVar('org_id', default=None)


class StructuredFormatter(logging.Formatter):
    """
    JSON formatter for structured logging

    Outputs logs as JSON for easy parsing by log aggregation systems.
    Includes request context (request_id, user_id, org_id) when available.
    """

    def format(self, record: logging.LogRecord) -> str:
        # Base log entry
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add context from ContextVars
        request_id = request_id_var.get()
        user_id = user_id_var.get()
        org_id = org_id_var.get()

        if request_id:
            log_data["request_id"] = request_id
        if user_id:
            log_data["user_id"] = user_id
        if org_id:
            log_data["org_id"] = org_id

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add any extra fields from the record
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs",
                "message", "pathname", "process", "processName",
                "relativeCreated", "thread", "threadName", "exc_info",
                "exc_text", "stack_info"
            ]:
                log_data[key] = value

        return json.dumps(log_data)


class HumanReadableFormatter(logging.Formatter):
    """
    Human-readable formatter for development

    Outputs logs in a format easy to read during development.
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        # Add color if outputting to terminal
        if sys.stdout.isatty():
            color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
            reset = self.COLORS['RESET']
            levelname = f"{color}{record.levelname}{reset}"
        else:
            levelname = record.levelname

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]

        # Base message
        message = f"{timestamp} {levelname:8} [{record.name}] {record.getMessage()}"

        # Add context if available
        request_id = request_id_var.get()
        user_id = user_id_var.get()
        org_id = org_id_var.get()

        context_parts = []
        if request_id:
            context_parts.append(f"req={request_id[:8]}")
        if user_id:
            context_parts.append(f"user={user_id[:8]}")
        if org_id:
            context_parts.append(f"org={org_id[:8]}")

        if context_parts:
            message += f" [{', '.join(context_parts)}]"

        # Add exception if present
        if record.exc_info:
            message += "\n" + self.formatException(record.exc_info)

        return message


def setup_logging(level: str = "INFO", structured: bool = False) -> None:
    """
    Setup logging configuration

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        structured: Use JSON structured logging (True) or human-readable (False)
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers = []

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    # Set formatter based on environment
    if structured:
        formatter = StructuredFormatter()
    else:
        formatter = HumanReadableFormatter()

    handler.setFormatter(formatter)
    logger.addHandler(handler)

    # Set level for third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.INFO)


def set_request_context(
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None
) -> None:
    """
    Set context for current request

    This context will be automatically included in all logs within the current request.

    Args:
        request_id: Unique request identifier
        user_id: User ID from authentication
        org_id: Organization ID for multi-tenancy
    """
    if request_id:
        request_id_var.set(request_id)
    if user_id:
        user_id_var.set(user_id)
    if org_id:
        org_id_var.set(org_id)


def clear_request_context() -> None:
    """Clear request context"""
    request_id_var.set(None)
    user_id_var.set(None)
    org_id_var.set(None)


def log_performance(
    logger: logging.Logger,
    operation: str,
    duration_ms: float,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log performance metrics

    Args:
        logger: Logger instance
        operation: Name of the operation
        duration_ms: Duration in milliseconds
        metadata: Additional metadata to log
    """
    log_data = {
        "operation": operation,
        "duration_ms": round(duration_ms, 2),
        "type": "performance"
    }

    if metadata:
        log_data.update(metadata)

    logger.info(f"Performance: {operation}", extra=log_data)


def log_business_event(
    logger: logging.Logger,
    event_type: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log business events for analytics

    Args:
        logger: Logger instance
        event_type: Type of business event
        metadata: Event metadata
    """
    log_data = {
        "event_type": event_type,
        "type": "business_event"
    }

    if metadata:
        log_data.update(metadata)

    logger.info(f"Business Event: {event_type}", extra=log_data)


# Auto-setup based on environment
if __name__ != "__main__":
    environment = os.getenv("ENVIRONMENT", "development")
    log_level = os.getenv("LOG_LEVEL", "INFO")
    use_structured = environment == "production"

    setup_logging(level=log_level, structured=use_structured)
