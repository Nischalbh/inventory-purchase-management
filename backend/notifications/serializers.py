from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Notification

        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "product",
            "product_name",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "product",
            "created_at",
        ]
