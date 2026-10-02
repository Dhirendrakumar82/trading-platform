from datetime import datetime

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Position, Trade
from .serializers import OrderSerializer, TradeSerializer
from .services import runtime
from .services.order_service import OrderError, place_order
from .services.price_service import price_store
from .services.trade_service import unrealized_pnl


class PricesView(APIView):
    def get(self, request):
        data = {}
        for symbol in settings.TRADING_INSTRUMENTS:
            quote = price_store.get(symbol)
            data[symbol] = quote.price if quote else None
        return Response(data)


class OrdersView(APIView):
    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trade = place_order(**serializer.validated_data)
        return Response(
            {"success": True, "message": "Order filled.", "trade": TradeSerializer(trade).data},
            status=status.HTTP_201_CREATED,
        )


class TradesView(APIView):
    def get(self, request):
        params, qs = request.query_params, Trade.objects.all()
        if symbol := params.get("symbol"):
            qs = qs.filter(symbol=symbol.upper())
        if side := params.get("side"):
            qs = qs.filter(side=side.upper())
        if trade_status := params.get("status"):
            qs = qs.filter(status=trade_status.upper())
        if date := params.get("date"):
            try:
                day = datetime.strptime(date, "%Y-%m-%d").date()
            except ValueError:
                raise OrderError("date must be YYYY-MM-DD.")
            qs = qs.filter(timestamp__date=day)
        try:
            limit = max(1, min(int(params.get("limit", 50)), 200))
        except ValueError:
            raise OrderError("limit must be an integer.")
        return Response(TradeSerializer(qs[:limit], many=True).data)


class PositionsView(APIView):
    def get(self, request):
        rows = []
        for pos in Position.objects.exclude(net_quantity=0).order_by("symbol"):
            quote = price_store.get(pos.symbol)
            rows.append({
                "symbol": pos.symbol,
                "net_quantity": float(pos.net_quantity),
                "average_price": float(pos.average_price),
                "unrealized_pnl": unrealized_pnl(pos, quote),
            })
        return Response(rows)


class HealthView(APIView):
    def get(self, request):
        auth, last = runtime.auth_service, price_store.last_update
        feed_ok = price_store.status == "connected"
        return Response({
            "backend": "ok",
            "status": "ok" if auth.authenticated and feed_ok else "degraded",
            "external_auth": "authenticated" if auth.authenticated else "not_authenticated",
            "websocket": price_store.status,
            "last_price_at": last.isoformat() if last else None,
            "server_time": timezone.now().isoformat(),
        })
