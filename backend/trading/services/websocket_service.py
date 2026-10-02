"""Maintains the connection to the external market feed with automatic reconnect."""
import asyncio
import json
import logging
import random
from urllib.parse import quote

import websockets
from django.conf import settings

from .auth_service import AuthError, AuthService
from .price_service import PriceStore, extract_ticks

logger = logging.getLogger(__name__)


class MarketFeedService:
    def __init__(self, auth: AuthService, store: PriceStore):
        self.auth = auth
        self.store = store
        self.malformed_count = 0
        self.reconnect_attempts = 0

    async def run_forever(self):
        logger.info("Market feed service starting (instruments: %s)", ", ".join(settings.TRADING_INSTRUMENTS))
        attempt = 0
        while True:
            try:
                self.store.status = "connecting"
                token = await self.auth.get_token()
                await self._session(token)
                attempt = 0  # a session that connected resets the backoff
                logger.warning("Feed connection closed by server")
                self.store.status = "disconnected"
            except asyncio.CancelledError:
                self.store.status = "disconnected"
                raise
            except AuthError:
                self.store.status = "error"  # already logged by AuthService
            except (OSError, asyncio.TimeoutError, websockets.WebSocketException) as exc:
                self.store.status = "disconnected"
                logger.warning("Feed connection lost: %s", exc.__class__.__name__)
            except Exception:
                self.store.status = "error"
                logger.exception("Unexpected feed error")

            self.auth.invalidate()  # always re-authenticate: the token may have expired
            attempt += 1
            self.reconnect_attempts += 1
            delay = min(settings.FEED_RECONNECT_MAX_SECONDS, settings.FEED_RECONNECT_BASE_SECONDS * 2 ** (attempt - 1))
            delay += random.uniform(0, delay * 0.25)
            logger.info("Reconnect attempt %d in %.1fs", attempt, delay)
            await asyncio.sleep(delay)

    async def _session(self, token):
        url = f"{settings.TRADING_WS_URL}?token={quote(token, safe='')}"  # never logged
        async with websockets.connect(url, open_timeout=15, ping_interval=20, ping_timeout=20) as ws:
            logger.info("Feed WebSocket connected")
            await self._subscribe(ws)
            self.store.status = "connected"
            while True:
                # No message for too long means a silently dead connection: force a reconnect.
                raw = await asyncio.wait_for(ws.recv(), timeout=settings.FEED_IDLE_TIMEOUT_SECONDS)
                self._handle(raw)

    async def _subscribe(self, ws):
        symbols = settings.TRADING_INSTRUMENTS
        await ws.send(json.dumps({"m": "subscribe", "p": symbols}))
        logger.info("Subscribed to %d instruments", len(symbols))

    def _handle(self, raw):
        try:
            payload = json.loads(raw)
        except (TypeError, ValueError):
            self._malformed("invalid JSON")
            return
        wanted = set(settings.TRADING_INSTRUMENTS)
        for tick in extract_ticks(payload):
            if tick.symbol in wanted:
                self.store.update(tick)

    def _malformed(self, reason):
        self.malformed_count += 1
        if self.malformed_count == 1 or self.malformed_count % 100 == 0:
            logger.warning("Malformed feed message (%s); total=%d", reason, self.malformed_count)
