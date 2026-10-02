"""Authenticates against the external trading REST API. Credentials stay server-side."""
import asyncio
import logging
from datetime import datetime, timezone

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)
TOKEN_KEYS = ("token", "access_token", "accessToken", "jwt")


class AuthError(Exception):
    """Raised when a token cannot be obtained. Messages are safe to log."""


class AuthService:
    def __init__(self):
        self._token = None
        self._lock = asyncio.Lock()
        self.authenticated = False
        self.authenticated_at = None
        self.last_error = None

    async def get_token(self, force=False):
        async with self._lock:
            if self._token and not force:
                return self._token
            try:
                self._token = await self._request_token()
            except AuthError as exc:
                self.invalidate()
                self.last_error = str(exc)
                logger.error("Authentication failed: %s", exc)
                raise
            self.authenticated = True
            self.authenticated_at = datetime.now(timezone.utc)
            self.last_error = None
            logger.info("Authentication succeeded")
            return self._token

    def invalidate(self):
        self._token = None
        self.authenticated = False

    async def _request_token(self):
        user, password = settings.TRADING_API_USERNAME, settings.TRADING_API_PASSWORD
        if not user or not password:
            raise AuthError("Trading API credentials are not configured")
        body = {
            settings.TRADING_AUTH_USERNAME_FIELD: user,
            settings.TRADING_AUTH_PASSWORD_FIELD: password,
            **settings.TRADING_AUTH_EXTRA,
        }
        kwargs = {"data": body} if settings.TRADING_AUTH_FORMAT == "form" else {"json": body}
        try:
            async with httpx.AsyncClient(timeout=settings.TRADING_HTTP_TIMEOUT) as client:
                resp = await client.post(settings.TRADING_AUTH_URL, **kwargs)
        except httpx.HTTPError as exc:
            raise AuthError(f"Auth API unreachable ({exc.__class__.__name__})") from exc

        if resp.status_code in (400, 401, 403):
            raise AuthError(f"Auth API rejected the credentials (HTTP {resp.status_code})")
        if resp.status_code >= 400:
            raise AuthError(f"Auth API error (HTTP {resp.status_code})")
        try:
            data = resp.json()
        except ValueError as exc:
            raise AuthError("Auth API returned a non-JSON response") from exc

        token = self._extract_token(data)
        if not token:
            raise AuthError("Auth API response did not contain a token")
        return token

    @staticmethod
    def _extract_token(data):
        if isinstance(data, str):
            return data.strip() or None
        if isinstance(data, dict):
            for key in TOKEN_KEYS:
                if isinstance(data.get(key), str) and data[key]:
                    return data[key]
            for nested in ("data", "result"):
                if isinstance(data.get(nested), (dict, str)):
                    found = AuthService._extract_token(data[nested])
                    if found:
                        return found
        return None
