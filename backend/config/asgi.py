"""ASGI entrypoint: HTTP (DRF) + WebSocket (Channels) + background market feed.

The external feed runs as an asyncio task on the server's event loop, so it never
blocks a request thread. It starts on ASGI lifespan startup when the server sends
one (uvicorn), and otherwise lazily on the first incoming connection (daphne).
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.asgi import get_asgi_application  # noqa: E402

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import AllowedHostsOriginValidator  # noqa: E402

from trading.routing import websocket_urlpatterns  # noqa: E402
from trading.services import runtime  # noqa: E402

_routes = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(URLRouter(websocket_urlpatterns)),
    }
)


async def application(scope, receive, send):
    if scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                await runtime.start_background_services()
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                await runtime.stop_background_services()
                await send({"type": "lifespan.shutdown.complete"})
                return
    else:
        await runtime.start_background_services()  # idempotent
        await _routes(scope, receive, send)
