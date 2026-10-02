from django.urls import path

from . import views

urlpatterns = [
    path("prices/", views.PricesView.as_view()),
    path("orders/", views.OrdersView.as_view()),
    path("trades/", views.TradesView.as_view()),
    path("positions/", views.PositionsView.as_view()),
    path("health/", views.HealthView.as_view()),
]
