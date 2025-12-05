"""
Performance Monitoring Middleware

Tracks request performance metrics and logs slow requests.
Provides observability into API response times and bottlenecks.
"""

import logging
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.structured_logging import log_performance, set_request_context, clear_request_context

logger = logging.getLogger(__name__)

# Performance thresholds (milliseconds)
SLOW_REQUEST_THRESHOLD_MS = 1000  # 1 second
VERY_SLOW_REQUEST_THRESHOLD_MS = 5000  # 5 seconds


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor and log API performance

    Features:
    - Tracks request duration
    - Logs slow requests
    - Adds performance headers to response
    - Sets request context for structured logging
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timing
        start_time = time.time()

        # Get or generate request ID
        request_id = request.headers.get("X-Request-ID", request.state.trace_id if hasattr(request.state, 'trace_id') else None)

        # Set request context for logging
        set_request_context(request_id=request_id)

        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log exception and re-raise
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration_ms, 2),
                    "error": str(e),
                    "type": "request_error"
                }
            )
            raise
        finally:
            # Clear request context
            clear_request_context()

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Add performance headers
        response.headers["X-Response-Time-Ms"] = str(round(duration_ms, 2))
        if request_id:
            response.headers["X-Request-ID"] = request_id

        # Log request
        self._log_request(request, response, duration_ms)

        return response

    def _log_request(self, request: Request, response: Response, duration_ms: float) -> None:
        """Log request with appropriate level based on status code and duration"""

        # Prepare log metadata
        metadata = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "type": "request"
        }

        # Add query params if present (excluding sensitive data)
        if request.url.query:
            metadata["query_params"] = str(request.url.query)

        # Determine log level based on status code and duration
        if response.status_code >= 500:
            # Server errors - always ERROR level
            logger.error(
                f"{request.method} {request.url.path} - {response.status_code} - {duration_ms:.2f}ms",
                extra=metadata
            )
        elif response.status_code >= 400:
            # Client errors - WARNING level
            logger.warning(
                f"{request.method} {request.url.path} - {response.status_code} - {duration_ms:.2f}ms",
                extra=metadata
            )
        elif duration_ms >= VERY_SLOW_REQUEST_THRESHOLD_MS:
            # Very slow requests - WARNING level
            logger.warning(
                f"VERY SLOW REQUEST: {request.method} {request.url.path} - {duration_ms:.2f}ms",
                extra=metadata
            )
        elif duration_ms >= SLOW_REQUEST_THRESHOLD_MS:
            # Slow requests - INFO level with flag
            metadata["slow"] = True
            logger.info(
                f"Slow request: {request.method} {request.url.path} - {duration_ms:.2f}ms",
                extra=metadata
            )
        else:
            # Normal requests - DEBUG level (to avoid log spam)
            logger.debug(
                f"{request.method} {request.url.path} - {response.status_code} - {duration_ms:.2f}ms",
                extra=metadata
            )


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log request and response sizes

    Helps identify large payloads that could impact performance.
    """

    MAX_PAYLOAD_SIZE_MB = 10  # 10 MB warning threshold

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get request body size if available
        request_size = request.headers.get("Content-Length")

        # Log large requests
        if request_size and int(request_size) > self.MAX_PAYLOAD_SIZE_MB * 1024 * 1024:
            logger.warning(
                f"Large request payload: {request.method} {request.url.path}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "size_bytes": int(request_size),
                    "size_mb": round(int(request_size) / (1024 * 1024), 2),
                    "type": "large_payload"
                }
            )

        response = await call_next(request)

        return response
