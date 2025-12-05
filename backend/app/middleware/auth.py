"""
Authentication Middleware with Clerk Integration
Handles JWT validation and user context extraction
"""

import os
import logging
from typing import Dict, Any, Optional, Callable, Annotated
from functools import wraps

import jwt
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthMiddleware:
    """Middleware for JWT authentication with Clerk"""

    def __init__(self):
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY")

        if not self.clerk_secret_key:
            logger.warning("CLERK_SECRET_KEY not set - auth will fail")
        if not self.jwt_secret_key:
            logger.warning("JWT_SECRET_KEY not set - auth will fail")

    def decode_token(self, token: str) -> Dict[str, Any]:
        """
        Decode and validate JWT token from Clerk

        Args:
            token: JWT token string

        Returns:
            Decoded token payload

        Raises:
            HTTPException: If token is invalid or expired
        """
        try:
            # Clerk uses RS256 algorithm for JWT signatures
            # In production, you should fetch Clerk's public key for verification
            # For now, we'll use the secret key (development only)
            payload = jwt.decode(
                token,
                self.jwt_secret_key,
                algorithms=["HS256"],
                options={"verify_exp": True}
            )
            return payload

        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def get_user_context(self, request: Request) -> Dict[str, Any]:
        """
        Extract user context from request headers

        CRITICAL SECURITY:
        - NEVER trust org_id from request body
        - ALWAYS extract org_id from validated JWT token
        - org_id is set as a custom claim in Clerk

        Args:
            request: FastAPI request object

        Returns:
            Dict containing user_id, org_id, role, email

        Raises:
            HTTPException: If authorization header is missing or invalid
        """
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            # Extract token from "Bearer <token>"
            scheme, token = auth_header.split(" ")

            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Decode and validate token
            payload = self.decode_token(token)

            # Extract user context from token claims
            # Clerk token structure:
            # - sub: user ID
            # - org_id: organization ID (custom claim)
            # - role: user role (custom claim)
            # - email: user email

            user_context = {
                "user_id": payload.get("sub"),
                "org_id": payload.get("org_id"),  # CRITICAL: From JWT only!
                "role": payload.get("role", "user"),
                "email": payload.get("email"),
                "session_id": payload.get("sid"),
            }

            # Validate required fields
            if not user_context["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID",
                )

            if not user_context["org_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not associated with an organization",
                )

            logger.info(f"User authenticated: {user_context['user_id']} (org: {user_context['org_id']})")

            return user_context

        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
                headers={"WWW-Authenticate": "Bearer"},
            )


# Global middleware instance
auth_middleware = AuthMiddleware()


def require_auth(func: Callable) -> Callable:
    """
    Decorator to require authentication on endpoints

    Usage:
        @app.post("/api/endpoint")
        @require_auth
        async def my_endpoint(user_context: dict, ...):
            org_id = user_context["org_id"]
            user_id = user_context["user_id"]
            ...
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract request from args
        request = None
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break

        if not request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found",
            )

        # Get user context
        user_context = auth_middleware.get_user_context(request)

        # Inject user_context into kwargs
        kwargs["user_context"] = user_context

        return await func(*args, **kwargs)

    return wrapper


def require_admin(func: Callable) -> Callable:
    """
    Decorator to require admin role

    Usage:
        @app.post("/api/admin/endpoint")
        @require_admin
        async def my_admin_endpoint(user_context: dict, ...):
            ...
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # First check authentication
        request = None
        for arg in args:
            if isinstance(arg, Request):
                request = arg
                break

        if not request:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Request object not found",
            )

        # Get user context
        user_context = auth_middleware.get_user_context(request)

        # Check admin role
        if user_context.get("role") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )

        # Inject user_context into kwargs
        kwargs["user_context"] = user_context

        return await func(*args, **kwargs)

    return wrapper


def get_optional_user_context(request: Request) -> Optional[Dict[str, Any]]:
    """
    Get user context if available, but don't require it
    Used for endpoints that work with or without authentication

    Returns:
        User context dict or None if not authenticated
    """
    try:
        return auth_middleware.get_user_context(request)
    except HTTPException:
        return None


# ============================================================================
# FastAPI Dependency Functions (Recommended Usage)
# ============================================================================

async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    FastAPI dependency to get current authenticated user

    Usage:
        @router.get("/endpoint")
        async def my_endpoint(user: dict = Depends(get_current_user)):
            org_id = user["org_id"]
            user_id = user["user_id"]
            ...
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Manually construct auth header for get_user_context
    # (since we're using the token from HTTPBearer)
    original_auth_header = request.headers.get("Authorization")
    request._auth_header_backup = original_auth_header

    return auth_middleware.get_user_context(request)


async def get_current_admin(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    FastAPI dependency to require admin role

    Usage:
        @router.post("/admin/endpoint")
        async def admin_endpoint(user: dict = Depends(get_current_admin)):
            ...
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return user


# Type aliases for cleaner endpoint signatures
UserContext = Annotated[Dict[str, Any], Depends(get_current_user)]
AdminContext = Annotated[Dict[str, Any], Depends(get_current_admin)]
