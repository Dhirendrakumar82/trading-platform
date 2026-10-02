import logging

from django.db import DatabaseError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .services.order_service import OrderError

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    """Every error leaves the API as {"success": false, "message": ...}. No stack traces."""
    if isinstance(exc, OrderError):
        return Response({"success": False, "message": exc.message}, status=exc.status_code)
    if isinstance(exc, DatabaseError):
        logger.exception("Database error")
        return Response({"success": False, "message": "Database is temporarily unavailable."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Unhandled API exception")
        return Response({"success": False, "message": "Internal server error."},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    detail = response.data
    message = "Invalid request." if response.status_code == 400 else str(detail.get("detail", "Request failed."))
    response.data = {"success": False, "message": message, "errors": detail if response.status_code == 400 else None}
    return response
