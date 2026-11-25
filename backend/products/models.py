from django.db import models

# Create your models here.
from django.db import models
from django.core.validators import MinValueValidator


class Product(models.Model):

    name = models.CharField(max_length=150)

    sku = models.CharField(max_length=50, unique=True)

    description = models.TextField(blank=True)

    category = models.CharField(max_length=100)

    cost_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )

    selling_price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(0)]
    )

    current_stock = models.PositiveIntegerField(default=0)

    reorder_level = models.PositiveIntegerField(default=10)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"
