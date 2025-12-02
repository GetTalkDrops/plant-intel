import time
import httpx
import jwt
from jwt import PyJWKClient
from dataclasses import dataclass
from typing import Optional
import os

# =====================================================
# CONFIG
# =====================================================

CLERK_JWKS_URL = "https://accurate-basilisk-92.clerk.accounts.dev/.well-known/jwks.json"
CLERK_API_URL = "https://api.clerk.com/v1"
CLERK_SECRET_KEY = os.getenv(sk_test_6fBniwvtxIMHiM9UCiFtDdRePohYcGrElvaNglccRB
)  # From environment
CLERK_ALLOWED_CLOCK_SKEW = 10  # seconds

# =====================================================
# MODELS
# =====================================================

@dataclass
class ClerkUser:
    id: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    image_url: Optional[str]
    session_id: Optional[str]
    org_id: Optional[str]
    org_role: Optional[str]
    raw: dict

# =====================================================
# JWT VERIFICATION
# =====================================================

_jwk_client = PyJWKClient(CLERK_JWKS_URL)


def verify_clerk_token(token: str) -> ClerkUser:
    """
    Verifies the Clerk session JWT using Clerk's JWKS.
    Returns a ClerkUser object.
    """
    signing_key = _jwk_client.get_signing_key_from_jwt(token).key

    # Decode and validate JWT
    payload = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        options={"verify_aud": False},  # Clerk FE tokens don't use aud
    )

    # Basic timestamp validation
    now = int(time.time())
    if payload.get("exp") and now > payload["exp"] + CLERK_ALLOWED_CLOCK_SKEW:
        raise ValueError("Clerk token expired")

    if payload.get("nbf") and now < payload["nbf"] - CLERK_ALLOWED_CLOCK_SKEW:
        raise ValueError("Clerk token not yet valid")

    return _clerk_user_from_payload(payload)


def _clerk_user_from_payload(payload: dict) -> ClerkUser:
    """Converts the Clerk JWT payload into a structured object."""
    email = None
    if "email" in payload:
        email = payload["email"]
    elif "email_addresses" in payload and payload["email_addresses"]:
        email = payload["email_addresses"][0]

    return ClerkUser(
        id=payload.get("sub"),
        email=email,
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        image_url=payload.get("image_url"),
        session_id=payload.get("sid"),
        org_id=payload.get("org_id"),
        org_role=payload.get("org_role"),
        raw=payload,
    )

# =====================================================
# FETCH USER FROM CLERK API (OPTIONAL)
# =====================================================

async def fetch_clerk_user(user_id: str) -> dict:
    """
    Calls Clerk's backend API to fetch full user data.
    """
    headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
    url = f"{CLERK_API_URL}/users/{user_id}"

    async with httpx.AsyncClient() as client:
        r = await client.get(url, headers=headers)

    if r.status_code != 200:
        raise Exception(f"Failed to fetch Clerk user: {r.text}")

    return r.json()

# =====================================================
# FASTAPI DEPENDENCY
# =====================================================

from fastapi import Depends, HTTPException, Header

async def get_current_user(authorization: str = Header(None)) -> ClerkUser:
    """
    Extracts the Bearer token, verifies it, and returns the ClerkUser.
    Use in FastAPI routes via Depends().
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="No Authorization header provided")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = authorization.replace("Bearer ", "").strip()

    try:
        user = verify_clerk_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    return user