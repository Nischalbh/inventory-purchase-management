from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from products.models import Product


class InventoryTransaction(models.Model):

    class TransactionType(models.TextChoices):
        STOCK_IN = "STOCK_IN", "Stock In"
        STOCK_OUT = "STOCK_OUT", "Stock Out"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"

    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="inventory_transactions"
    )

    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)

    quantity = models.PositiveIntegerField()

    previous_stock = models.PositiveIntegerField()

    new_stock = models.PositiveIntegerField()

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_transactions",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.transaction_type}"
