from django.contrib import admin

from .models import Instrument, Position, Trade

admin.site.register(Instrument)
admin.site.register(Position)


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ("trade_id", "symbol", "side", "quantity", "price", "status", "timestamp")
    list_filter = ("symbol", "side", "status")
