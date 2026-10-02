"""Process-wide singletons and lifecycle of the background tasks."""
import asyncio
import logging

from asgiref.sync import sync_to_async
from django.conf import settings
from django.db import DatabaseError

from .auth_service import AuthService
from .price_service import broadcast_loop, price_store
from .websocket_service import MarketFeedService

logger = logging.getLogger(__name__)

auth_service = AuthService()
feed_service = MarketFeedService(auth_service, price_store)

_started = False
_tasks = []


def sync_instruments():
    from trading.models import Instrument

    for symbol in settings.TRADING_INSTRUMENTS:
        Instrument.objects.get_or_create(symbol=symbol, defaults={"name": symbol})


async def start_background_services():
    global _started
    if _started:
        return
    _started = True  # set before awaiting so concurrent first requests don't double-start
    logger.info("Application startup: launching background services")
    try:
        await sync_to_async(sync_instruments)()
    except DatabaseError:
        logger.exception("Could not sync instruments (have migrations been applied?)")
    _tasks.append(asyncio.create_task(feed_service.run_forever(), name="market-feed"))
    _tasks.append(asyncio.create_task(broadcast_loop(), name="price-broadcast"))


async def stop_background_services():
    for task in _tasks:
        task.cancel()
    await asyncio.gather(*_tasks, return_exceptions=True)
    _tasks.clear()
