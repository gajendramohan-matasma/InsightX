"""
Power BI authentication using MSAL ConfidentialClientApplication.
"""

import logging
from typing import Optional

import msal

from app.config import settings

logger = logging.getLogger(__name__)


class PowerBIAuth:
    """
    Manages Power BI authentication via Azure AD using MSAL.
    Uses client_credentials flow with automatic caching.
    """

    def __init__(
        self,
        tenant_id: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        self.tenant_id = tenant_id or settings.POWERBI_TENANT_ID
        self.client_id = client_id or settings.POWERBI_CLIENT_ID
        self.client_secret = client_secret or settings.POWERBI_CLIENT_SECRET
        self._scope = [settings.POWERBI_SCOPE]
        self._app: Optional[msal.ConfidentialClientApplication] = None

    @property
    def is_configured(self) -> bool:
        return bool(self.tenant_id and self.client_id and self.client_secret)

    def _get_msal_app(self) -> msal.ConfidentialClientApplication:
        """Lazily create or return the cached MSAL app."""
        if self._app is None:
            authority = f"{settings.POWERBI_AUTHORITY_URL}/{self.tenant_id}"
            self._app = msal.ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=authority,
            )
        return self._app

    def get_access_token(self) -> str:
        """
        Acquire an access token for the Power BI API.
        MSAL handles caching and refresh internally.
        """
        app = self._get_msal_app()

        # Try to get token from cache first
        result = app.acquire_token_silent(scopes=self._scope, account=None)
        if result and "access_token" in result:
            return result["access_token"]

        # Fall back to client credentials
        result = app.acquire_token_for_client(scopes=self._scope)

        if "access_token" not in result:
            error = result.get("error_description", result.get("error", "Unknown error"))
            logger.error("Failed to acquire Power BI token: %s", error)
            raise RuntimeError(f"Power BI authentication failed: {error}")

        logger.info("Power BI access token acquired")
        return result["access_token"]

    def get_auth_headers(self) -> dict:
        """Return headers dict with valid Authorization bearer token."""
        token = self.get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def invalidate(self) -> None:
        """Force re-creation of MSAL app on next call."""
        self._app = None
