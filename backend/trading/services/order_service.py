"""Order validation and live price selection. No HTTP concerns here."""
import logging

from trading.models import Instrument, Trade

from .price_service import price_store
from .trade_service import execute_trade

logger = logging.getLogger(__name__)


class OrderError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_fill_price(symbol, side, store=price_store):
    """BUY fills at the ask, SELL at the bid (falls back to the last price)."""
    quote = store.get(symbol)
    if quote is None or store.is_stale(quote):
        raise OrderError("Latest price is currently unavailable.", 503)
    if side == Trade.Side.BUY:
        return quote.ask or quote.price
    return quote.bid or quote.price


def place_order(symbol, side, quantity, store=price_store):
    symbol = symbol.strip().upper()
    if not Instrument.objects.filter(symbol=symbol, is_active=True).exists():
        raise OrderError(f"Unknown or inactive symbol: {symbol}.")
    price = get_fill_price(symbol, side, store)
    trade = execute_trade(symbol, side, quantity, price)
    logger.info("Order filled: %s %s %s @ %s (%s)", side, quantity, symbol, price, trade.trade_id)
    return trade
