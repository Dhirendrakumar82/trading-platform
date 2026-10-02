"""Persistence of trades and net positions."""
import uuid
from decimal import Decimal

from django.db import transaction

from trading.models import Position, Trade

EIGHT = Decimal("0.00000001")


def _d(value):
    return Decimal(str(value)).quantize(EIGHT)


@transaction.atomic
def execute_trade(symbol, side, quantity, price):
    quantity, price = _d(quantity), _d(price)
    trade = Trade.objects.create(
        trade_id=uuid.uuid4().hex, symbol=symbol, side=side, quantity=quantity, price=price,
        status=Trade.Status.FILLED,
    )
    _apply_to_position(symbol, side, quantity, price)
    return trade


def _apply_to_position(symbol, side, quantity, price):
    position, _ = Position.objects.select_for_update().get_or_create(symbol=symbol)
    signed = quantity if side == Trade.Side.BUY else -quantity
    old, avg = position.net_quantity, position.average_price
    new = old + signed

    if old == 0 or (old > 0) == (signed > 0):  # opening or adding: weighted average
        total = abs(old) + abs(signed)
        position.average_price = ((abs(old) * avg + abs(signed) * price) / total).quantize(EIGHT)
    elif new == 0:
        position.average_price = Decimal(0)
    elif (new > 0) != (old > 0):  # flipped through zero: remainder opens at fill price
        position.average_price = price
    # else: partially reduced, average price unchanged (realized PnL is not tracked)
    position.net_quantity = new
    position.save()


def unrealized_pnl(position, quote):
    if quote is None or position.net_quantity == 0:
        return None
    return (quote.price - float(position.average_price)) * float(position.net_quantity)
