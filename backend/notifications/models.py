from django.db import models

# Create your models here.
from django.db import models
from products.models import Product


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        LOW_STOCK = "LOW_STOCK", "Low Stock"
        GENERAL = "GENERAL", "General"

    title = models.CharField(max_length=200)

    message = models.TextField()

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
