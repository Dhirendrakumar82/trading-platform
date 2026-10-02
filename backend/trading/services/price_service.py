"""In-memory latest-price store, tolerant tick parser and throttled UI broadcaster."""
import asyncio
import dataclasses
import logging
import math
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from channels.layers import get_channel_layer
from django.conf import settings

logger = logging.getLogger(__name__)
GROUP = "prices"

SYMBOL_KEYS = ("symbol", "s", "instrument", "sym")
BID_KEYS = ("bid", "b")
ASK_KEYS = ("ask", "a")
LAST_KEYS = ("price", "last", "p", "mid")
TS_KEYS = ("timestamp", "ts", "t", "time")
ENVELOPE_KEYS = ("d", "data", "p", "payload", "ticks", "quotes")


@dataclass(frozen=True)
class Tick:
    symbol: str
    price: float
    bid: Optional[float] = None
    ask: Optional[float] = None
    timestamp: Optional[datetime] = None


@dataclass(frozen=True)
class Quote:
    symbol: str
    price: float
    bid: Optional[float]
    ask: Optional[float]
    timestamp: datetime
    received_at: float  # monotonic seconds, used for staleness checks

    def as_dict(self):
        return {"price": self.price, "bid": self.bid, "ask": self.ask, "timestamp": self.timestamp.isoformat()}


def _num(value):
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and number > 0 else None


def _first(obj, keys):
    for key in keys:
        if key in obj and obj[key] is not None:
            return obj[key]
    return None


def _parse_ts(value):
    try:
        if isinstance(value, str):
            try:
                value = float(value)
            except ValueError:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            if value > 1e11:  # milliseconds
                value /= 1000
            return datetime.fromtimestamp(value, tz=timezone.utc)
    except (ValueError, OverflowError, OSError):
        pass
    return None


def extract_ticks(payload):
    """Yield Tick objects from a decoded message.

    The vendor message schema is not guaranteed, so this accepts flat objects, lists,
    and common envelopes ({"d": {...}}, {"data": [...]}). Anything that cannot be
    read as a valid positive price is skipped. Subscription acks yield nothing.
    """
    if isinstance(payload, list):
        for item in payload:
            yield from extract_ticks(item)
        return
    if not isinstance(payload, dict):
        return
    for key in ENVELOPE_KEYS:
        inner = payload.get(key)
        if isinstance(inner, (dict, list)):
            yield from extract_ticks(inner)
    symbol = _first(payload, SYMBOL_KEYS)
    if not isinstance(symbol, str):
        return
    bid, ask = _num(_first(payload, BID_KEYS)), _num(_first(payload, ASK_KEYS))
    price = _num(_first(payload, LAST_KEYS))
    if price is None:
        price = (bid + ask) / 2 if bid and ask else (bid or ask)
    if price is None:
        return
    yield Tick(symbol.strip().upper(), price, bid, ask, _parse_ts(_first(payload, TS_KEYS)))


class PriceStore:
    """Thread-safe: written by the feed task, read by sync DRF views and the broadcaster."""

    def __init__(self):
        self._lock = threading.Lock()
        self._quotes = {}
        self._dirty = set()
        self.status = "disconnected"  # connecting | connected | disconnected | error
        self.last_update = None

    def update(self, tick):
        """Store a tick. Returns True if the visible price changed."""
        now = time.monotonic()
        with self._lock:
            current = self._quotes.get(tick.symbol)
            if current and tick.timestamp and tick.timestamp < current.timestamp:
                return False  # delayed / out-of-order message
            if current and (tick.price, tick.bid, tick.ask) == (current.price, current.bid, current.ask):
                # duplicate values: no UI change, but the feed is alive so the price is still fresh
                self._quotes[tick.symbol] = dataclasses.replace(current, received_at=now)
                self.last_update = datetime.now(timezone.utc)
                return False
            ts = tick.timestamp or datetime.now(timezone.utc)
            self._quotes[tick.symbol] = Quote(tick.symbol, tick.price, tick.bid, tick.ask, ts, now)
            self._dirty.add(tick.symbol)
            self.last_update = datetime.now(timezone.utc)
            return True

    def get(self, symbol):
        with self._lock:
            return self._quotes.get(symbol)

    def is_stale(self, quote):
        return time.monotonic() - quote.received_at > settings.PRICE_MAX_AGE_SECONDS

    def snapshot(self):
        with self._lock:
            return {s: q.as_dict() for s, q in self._quotes.items()}

    def pop_changed(self):
        with self._lock:
            changed = {s: self._quotes[s].as_dict() for s in self._dirty}
            self._dirty.clear()
            return changed


price_store = PriceStore()


async def broadcast_loop(store=price_store):
    """Batch changed prices and push them to browsers at a fixed rate (default 4/s)."""
    layer = get_channel_layer()
    interval = settings.UI_BROADCAST_INTERVAL_MS / 1000
    last_status = None
    while True:
        await asyncio.sleep(interval)
        changed, status = store.pop_changed(), store.status
        if not changed and status == last_status:
            continue
        last_status = status
        try:
            await layer.group_send(GROUP, {"type": "feed.update", "prices": changed, "status": status})
        except Exception:
            logger.exception("Failed to broadcast price update")
