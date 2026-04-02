"""
Authentication middleware for Azure AD JWT validation.

Provides:
  - get_current_user: FastAPI dependency that validates the JWT from the
    Authorization header against Azure AD's JWKS endpoint and returns/creates
    the User record.
  - require_admin: Dependency that ensures the user has the admin role.
"""

import logging
import uuid as uuid_mod
from datetime import datetime, timezone
from typing import Optional

import httpx
import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)

# Cache for Azure AD JWKS keys
_jwks_cache: Optional[dict] = None
_jwks_cache_time: float = 0.0
_JWKS_CACHE_TTL = 3600  # 1 hour


async def _get_jwks() -> dict:
    """Fetch and cache the Azure AD JWKS keys."""
    import time

    global _jwks_cache, _jwks_cache_time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < _JWKS_CACHE_TTL:
        return _jwks_cache

    jwks_url = (
        f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}"
        f"/discovery/v2.0/keys"
    )

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url, timeout=10.0)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
        return _jwks_cache


def _get_signing_key(jwks: dict, kid: str) -> Optional[str]:
    """Find the signing key matching the JWT's kid header."""
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return pyjwt.algorithms.RSAAlgorithm.from_jwk(key)
    return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate the Azure AD JWT and return the corresponding User.

    If the user does not exist in the database, create a new record.
    If Azure AD is not configured, creates/returns a development user.
    """

    # Development bypass: if Azure AD is not configured, use a dev user
    if not settings.AZURE_AD_TENANT_ID or not settings.AZURE_AD_CLIENT_ID:
        return await _get_or_create_dev_user(db)

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Decode header to get kid
        unverified_header = pyjwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token header missing kid",
            )

        # Fetch JWKS and find signing key
        jwks = await _get_jwks()
        signing_key = _get_signing_key(jwks, kid)
        if not signing_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate signing key",
            )

        # Determine issuer
        issuer = settings.AZURE_AD_ISSUER or (
            f"https://login.microsoftonline.com/{settings.AZURE_AD_TENANT_ID}/v2.0"
        )

        # Verify and decode token
        payload = pyjwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.AZURE_AD_AUDIENCE,
            issuer=issuer,
            options={"verify_exp": True},
        )

    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except pyjwt.InvalidTokenError as e:
        logger.warning("Invalid JWT: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )

    # Extract user info from claims
    azure_oid = payload.get("oid", "")
    email = payload.get("preferred_username") or payload.get("email") or payload.get("upn", "")
    display_name = payload.get("name", email)

    if not azure_oid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing oid claim",
        )

    # Get or create user
    stmt = select(User).where(User.azure_oid == azure_oid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user:
        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
    else:
        # Determine role from token claims
        roles = payload.get("roles", [])
        role = UserRole.ADMIN if "Admin" in roles else (
            UserRole.ANALYST if "Analyst" in roles else UserRole.USER
        )

        user = User(
            azure_oid=azure_oid,
            email=email,
            display_name=display_name,
            role=role,
        )
        db.add(user)

    await db.flush()
    return user


async def _get_or_create_dev_user(db: AsyncSession) -> User:
    """Get or create a development user for local testing."""
    try:
        dev_oid = "dev-user-00000000-0000-0000-0000-000000000001"
        stmt = select(User).where(User.azure_oid == dev_oid)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                azure_oid=dev_oid,
                email="dev@insightx.com",
                display_name="Dev User",
                role=UserRole.ADMIN,
            )
            db.add(user)
            await db.flush()

        return user
    except Exception:
        # DB unavailable — return a simple object mimicking a User
        class _DevUser:
            id = uuid_mod.UUID("00000000-0000-0000-0000-000000000001")
            azure_oid = "dev-user-00000000-0000-0000-0000-000000000001"
            email = "dev@insightx.com"
            display_name = "Dev User"
            role = UserRole.ADMIN
        return _DevUser()  # type: ignore


async def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    """Dependency that requires the current user to have the admin role."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
