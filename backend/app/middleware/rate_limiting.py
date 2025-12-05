"""
Rate Limiting Middleware
Prevents API abuse and ensures fair usage
"""

import time
import logging
from typing import Dict, Tuple
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware

    For production, consider using Redis for distributed rate limiting
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1 minute window in seconds

        # Store: {client_id: [(timestamp1, timestamp2, ...)]}
        self.requests: Dict[str, list] = defaultdict(list)

        # Last cleanup time
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # Clean up every 5 minutes

    def _get_client_id(self, request: Request) -> str:
        """
        Get unique client identifier
        Priority: user_id > org_id > IP address
        """
        # Try to get authenticated user/org
        if hasattr(request.state, "user"):
            user = request.state.user
            return f"user:{user.get('user_id', 'unknown')}"

        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        return f"ip:{client_ip}"

    def _cleanup_old_requests(self):
        """Remove old request timestamps to prevent memory leak"""
        current_time = time.time()

        # Only cleanup periodically
        if current_time - self.last_cleanup < self.cleanup_interval:
            return

        cutoff_time = current_time - self.window_size

        # Remove old timestamps
        for client_id in list(self.requests.keys()):
            self.requests[client_id] = [
                ts for ts in self.requests[client_id]
                if ts > cutoff_time
            ]

            # Remove client if no recent requests
            if not self.requests[client_id]:
                del self.requests[client_id]

        self.last_cleanup = current_time
        logger.debug(f"Rate limit cleanup complete. Tracking {len(self.requests)} clients")

    def _check_rate_limit(self, client_id: str) -> Tuple[bool, int, int]:
        """
        Check if client has exceeded rate limit

        Returns:
            (is_allowed, current_count, limit)
        """
        current_time = time.time()
        cutoff_time = current_time - self.window_size

        # Get recent requests within the window
        recent_requests = [
            ts for ts in self.requests[client_id]
            if ts > cutoff_time
        ]

        # Update stored requests
        self.requests[client_id] = recent_requests

        # Check limit
        current_count = len(recent_requests)
        is_allowed = current_count < self.requests_per_minute

        if is_allowed:
            # Add current request
            self.requests[client_id].append(current_time)

        return is_allowed, current_count + (1 if is_allowed else 0), self.requests_per_minute

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""

        # Skip rate limiting for health checks
        if request.url.path.startswith("/api/v1/health"):
            return await call_next(request)

        # Cleanup old data periodically
        self._cleanup_old_requests()

        # Get client identifier
        client_id = self._get_client_id(request)

        # Check rate limit
        is_allowed, current_count, limit = self._check_rate_limit(client_id)

        if not is_allowed:
            # Rate limit exceeded
            logger.warning(
                f"Rate limit exceeded for {client_id}",
                extra={
                    "client_id": client_id,
                    "path": request.url.path,
                    "current_count": current_count,
                    "limit": limit
                }
            )

            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {limit} requests per minute",
                    "retry_after": 60
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + 60),
                    "Retry-After": "60"
                }
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        remaining = limit - current_count
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window_size)

        return response


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Whitelist specific IPs for admin access
    """

    def __init__(self, app, whitelist: list = None):
        super().__init__(app)
        self.whitelist = set(whitelist or [])

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        return client_ip

    async def dispatch(self, request: Request, call_next):
        """Check IP whitelist for protected paths"""

        # Only enforce on admin paths
        if not request.url.path.startswith("/admin"):
            return await call_next(request)

        if not self.whitelist:
            # No whitelist configured, allow all
            return await call_next(request)

        client_ip = self._get_client_ip(request)

        if client_ip not in self.whitelist:
            logger.warning(f"Blocked admin access from {client_ip}")
            return JSONResponse(
                status_code=403,
                content={"error": "Forbidden", "message": "Access denied"}
            )

        return await call_next(request)
