from decimal import Decimal

from rest_framework import serializers

from .models import Trade


class OrderSerializer(serializers.Serializer):
    symbol = serializers.CharField(max_length=20)
    side = serializers.ChoiceField(choices=Trade.Side.values)
    quantity = serializers.DecimalField(max_digits=18, decimal_places=8, min_value=Decimal("0.00000001"))

    def validate_side(self, value):
        return value.upper()

    def to_internal_value(self, data):
        if isinstance(data, dict) and isinstance(data.get("side"), str):
            data = {**data, "side": data["side"].strip().upper()}
        return super().to_internal_value(data)


class TradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trade
        fields = ["id", "trade_id", "symbol", "side", "quantity", "price", "status", "timestamp"]
