from django.db import models

# Create your models here.
from django.db import models
from django.core.validators import MinValueValidator
from suppliers.models import Supplier
from products.models import Product


class PurchaseOrder(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        RECEIVED = "RECEIVED", "Received"
        CANCELLED = "CANCELLED", "Cancelled"

    order_number = models.CharField(max_length=50, unique=True)

    supplier = models.ForeignKey(
        Supplier, on_delete=models.PROTECT, related_name="purchase_orders"
    )

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    order_date = models.DateField(auto_now_add=True)

    expected_delivery_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number

    @property
    def total_amount(self):
        return sum(item.line_total for item in self.items.all())


class PurchaseOrderItem(models.Model):

    purchase_order = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, related_name="items"
    )

    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name="purchase_order_items"
    )

    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    unit_cost = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["purchase_order", "product"],
                name="unique_product_per_purchase_order",
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"

    @property
    def line_total(self):
        return self.quantity * self.unit_cost
