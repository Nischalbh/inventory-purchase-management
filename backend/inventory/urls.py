from django.urls import path

from .views import InventoryTransactionListCreateView, InventoryTransactionDetailView

urlpatterns = [
    path(
        "transactions/",
        InventoryTransactionListCreateView.as_view(),
        name="inventory-transaction-list-create",
    ),
    path(
        "transactions/<int:transaction_id>/",
        InventoryTransactionDetailView.as_view(),
        name="inventory-transaction-detail",
    ),
]
