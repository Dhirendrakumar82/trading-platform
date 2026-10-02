"""Mock market feed — generates realistic fake prices when no real credentials are configured.
Prices follow a random-walk model seeded from realistic base values.
"""
import asyncio
import logging
import random
from datetime import datetime, timezone

from django.conf import settings

from .price_service import PriceStore, Tick

logger = logging.getLogger(__name__)

# Realistic base prices for each instrument
BASE_PRICES = {
    "BTC-USD": 67500.0,
    "GBPUSD": 1.2650,
    "USDJPY": 149.50,
}

# Max % move per tick (controls volatility)
VOLATILITY = {
    "BTC-USD": 0.0008,
    "GBPUSD": 0.00015,
    "USDJPY": 0.00015,
}

# Spread (bid/ask difference) as fraction of price
SPREAD = {
    "BTC-USD": 0.0002,
    "GBPUSD": 0.00005,
    "USDJPY": 0.00005,
}

TICK_INTERVAL_SECONDS = 0.5  # emit a tick every 500ms


class MockFeedService:
    """Generates fake price ticks and feeds them into the PriceStore.
    Behaves identically to MarketFeedService from the store's perspective.
    """

    def __init__(self, store: PriceStore):
        self.store = store
        self._prices = {s: p for s, p in BASE_PRICES.items()}

    async def run_forever(self):
        instruments = [s.upper() for s in settings.TRADING_INSTRUMENTS]
        active = [s for s in instruments if s in BASE_PRICES]
        if not active:
            logger.warning("MockFeedService: no known instruments to mock, using defaults")
            active = list(BASE_PRICES.keys())

        logger.info("MockFeedService starting — generating fake prices for: %s", ", ".join(active))
        self.store.status = "connected"

        while True:
            try:
                for symbol in active:
                    tick = self._next_tick(symbol)
                    self.store.update(tick)
                await asyncio.sleep(TICK_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                self.store.status = "disconnected"
                logger.info("MockFeedService stopped")
                raise
            except Exception:
                logger.exception("MockFeedService unexpected error")
                await asyncio.sleep(1)

    def _next_tick(self, symbol: str) -> Tick:
        vol = VOLATILITY.get(symbol, 0.0005)
        spread_frac = SPREAD.get(symbol, 0.0001)

        change = self._prices[symbol] * vol * random.uniform(-1, 1)
        self._prices[symbol] = max(self._prices[symbol] + change, 0.0001)

        price = round(self._prices[symbol], 5)
        half_spread = price * spread_frac / 2
        bid = round(price - half_spread, 5)
        ask = round(price + half_spread, 5)

        return Tick(
            symbol=symbol,
            price=price,
            bid=bid,
            ask=ask,
            timestamp=datetime.now(timezone.utc),
        )
