from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest import mock

from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from .models import Instrument, Position, Trade
from .services.price_service import PriceStore, Tick, extract_ticks


class ParserTests(SimpleTestCase):
    def test_flat_bid_ask(self):
        (t,) = extract_ticks({"symbol": "gbpusd", "bid": 1.34, "ask": 1.3402})
        self.assertEqual((t.symbol, t.bid, t.ask), ("GBPUSD", 1.34, 1.3402))

    def test_envelope_and_list(self):
        ticks = list(extract_ticks({"d": [{"s": "BTC-USD", "p": 65000.5}, {"s": "USDJPY", "p": 148.2}]}))
        self.assertEqual([t.symbol for t in ticks], ["BTC-USD", "USDJPY"])

    def test_invalid_and_ack_messages_ignored(self):
        self.assertEqual(list(extract_ticks({"m": "subscribed", "p": ["BTC-USD"]})), [])
        self.assertEqual(list(extract_ticks({"symbol": "BTC-USD", "price": -1})), [])
        self.assertEqual(list(extract_ticks({"symbol": "BTC-USD", "price": "abc"})), [])
        self.assertEqual(list(extract_ticks("garbage")), [])


class StoreTests(SimpleTestCase):
    def test_delayed_tick_ignored_and_duplicate_not_dirty(self):
        store, now = PriceStore(), datetime.now(timezone.utc)
        self.assertTrue(store.update(Tick("BTC-USD", 100.0, timestamp=now)))
        self.assertFalse(store.update(Tick("BTC-USD", 90.0, timestamp=now - timedelta(seconds=5))))
        store.pop_changed()
        self.assertFalse(store.update(Tick("BTC-USD", 100.0, timestamp=now)))
        self.assertEqual(store.pop_changed(), {})
        self.assertEqual(store.get("BTC-USD").price, 100.0)


class OrderApiTests(TestCase):
    def setUp(self):
        Instrument.objects.create(symbol="BTC-USD")
        self.store = PriceStore()
        self.client = APIClient()
        patcher = mock.patch("trading.services.order_service.price_store", self.store)
        patcher.start()
        self.addCleanup(patcher.stop)

    def order(self, **overrides):
        body = {"symbol": "BTC-USD", "side": "BUY", "quantity": "1", **overrides}
        return self.client.post("/api/orders/", body, format="json")

    def test_buy_uses_ask_and_creates_position(self):
        self.store.update(Tick("BTC-USD", 100.0, bid=99.0, ask=101.0))
        res = self.order()
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Trade.objects.get().price, Decimal("101"))
        self.assertEqual(Position.objects.get().net_quantity, Decimal("1"))

    def test_sell_uses_bid(self):
        self.store.update(Tick("BTC-USD", 100.0, bid=99.0, ask=101.0))
        self.order(side="sell")
        self.assertEqual(Trade.objects.get().price, Decimal("99"))

    def test_missing_price(self):
        res = self.order()
        self.assertEqual(res.status_code, 503)
        self.assertFalse(res.json()["success"])
        self.assertEqual(Trade.objects.count(), 0)

    def test_validation(self):
        self.store.update(Tick("BTC-USD", 100.0))
        self.assertEqual(self.order(quantity=0).status_code, 400)
        self.assertEqual(self.order(quantity=-2).status_code, 400)
        self.assertEqual(self.order(side="HOLD").status_code, 400)
        self.assertEqual(self.order(symbol="").status_code, 400)
        self.assertEqual(self.order(symbol="XXX").status_code, 400)
        self.assertEqual(Trade.objects.count(), 0)

    def test_trade_history(self):
        self.store.update(Tick("BTC-USD", 100.0))
        self.order()
        res = self.client.get("/api/trades/?symbol=BTC-USD&side=BUY")
        self.assertEqual(len(res.json()), 1)
