from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .services.price_service import GROUP, price_store


class PriceConsumer(AsyncJsonWebsocketConsumer):
    """Pushes throttled price updates and feed status to the React client."""

    async def connect(self):
        await self.channel_layer.group_add(GROUP, self.channel_name)
        await self.accept()
        await self.send_json({"type": "snapshot", "prices": price_store.snapshot(), "status": price_store.status})

    async def disconnect(self, code):
        await self.channel_layer.group_discard(GROUP, self.channel_name)

    async def feed_update(self, event):  # handles group message type "feed.update"
        await self.send_json({"type": "update", "prices": event["prices"], "status": event["status"]})
