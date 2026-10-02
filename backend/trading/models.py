from django.db import models
from django.utils import timezone


class Instrument(models.Model):
    symbol = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["symbol"]

    def __str__(self):
        return self.symbol


class Trade(models.Model):
    class Side(models.TextChoices):
        BUY = "BUY"
        SELL = "SELL"

    class Status(models.TextChoices):
        FILLED = "FILLED"
        REJECTED = "REJECTED"

    trade_id = models.CharField(max_length=36, unique=True)
    symbol = models.CharField(max_length=20, db_index=True)
    side = models.CharField(max_length=4, choices=Side.choices)
    quantity = models.DecimalField(max_digits=18, decimal_places=8)
    price = models.DecimalField(max_digits=24, decimal_places=8)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.FILLED)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)  # server time
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="trade_quantity_gt_0"),
            models.CheckConstraint(condition=models.Q(price__gt=0), name="trade_price_gt_0"),
            models.CheckConstraint(condition=models.Q(side__in=["BUY", "SELL"]), name="trade_side_valid"),
        ]

    def __str__(self):
        return f"{self.trade_id} {self.side} {self.quantity} {self.symbol}"


class Position(models.Model):
    """Net position per symbol. Unrealized PnL is derived from the live price on read
    (it changes every tick, so persisting it would be stale immediately)."""

    symbol = models.CharField(max_length=20, unique=True)
    net_quantity = models.DecimalField(max_digits=24, decimal_places=8, default=0)
    average_price = models.DecimalField(max_digits=24, decimal_places=8, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol}: {self.net_quantity} @ {self.average_price}"
