"""
Anaplan OAuth2 client_credentials authentication with automatic token refresh.
"""

import logging
import time
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class AnaplanAuth:
    """
    Manages Anaplan OAuth2 authentication using the client_credentials grant type.
    Automatically refreshes the access token before it expires.
    """

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        auth_url: Optional[str] = None,
    ):
        self.client_id = client_id or settings.ANAPLAN_CLIENT_ID
        self.client_secret = client_secret or settings.ANAPLAN_CLIENT_SECRET
        self.auth_url = auth_url or settings.ANAPLAN_AUTH_URL
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0.0
        self._token_buffer_seconds: int = 60  # refresh 60s before expiry

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    @property
    def _is_token_valid(self) -> bool:
        if self._access_token is None:
            return False
        return time.time() < (self._token_expiry - self._token_buffer_seconds)

    async def get_access_token(self, client: httpx.AsyncClient) -> str:
        """
        Return a valid access token. Fetches or refreshes automatically.
        """
        if self._is_token_valid:
            return self._access_token  # type: ignore[return-value]
        return await self._fetch_token(client)

    async def _fetch_token(self, client: httpx.AsyncClient) -> str:
        """
        Fetch a new access token from Anaplan's OAuth2 token endpoint.
        """
        logger.info("Fetching new Anaplan access token")
        response = await client.post(
            self.auth_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        response.raise_for_status()
        data = response.json()

        self._access_token = data["access_token"]
        # Anaplan tokens typically expire in 35 minutes (2100 seconds)
        expires_in = data.get("expires_in", 2100)
        self._token_expiry = time.time() + expires_in

        logger.info("Anaplan access token acquired, expires in %ds", expires_in)
        return self._access_token  # type: ignore[return-value]

    async def get_auth_headers(self, client: httpx.AsyncClient) -> dict:
        """Return headers dict with valid Authorization bearer token."""
        token = await self.get_access_token(client)
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def invalidate(self) -> None:
        """Force token refresh on next call."""
        self._access_token = None
        self._token_expiry = 0.0
