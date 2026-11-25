from django.urls import path

from .views import (
    PurchaseOrderListCreateView,
    PurchaseOrderDetailView,
    PurchaseOrderItemListCreateView,
    PurchaseOrderItemDetailView,
)

urlpatterns = [
    path("", PurchaseOrderListCreateView.as_view(), name="purchase-order-list-create"),
    path(
        "<int:order_id>/",
        PurchaseOrderDetailView.as_view(),
        name="purchase-order-detail",
    ),
    path(
        "<int:order_id>/items/",
        PurchaseOrderItemListCreateView.as_view(),
        name="purchase-order-item-list-create",
    ),
    path(
        "items/<int:item_id>/",
        PurchaseOrderItemDetailView.as_view(),
        name="purchase-order-item-detail",
    ),
]
