from rest_framework import serializers
from products.models import Product
from .models import InventoryTransaction


class InventoryTransactionSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)

    sku = serializers.CharField(source="product.sku", read_only=True)

    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = InventoryTransaction

        fields = [
            "id",
            "product",
            "product_name",
            "sku",
            "transaction_type",
            "quantity",
            "previous_stock",
            "new_stock",
            "notes",
            "created_by",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "previous_stock",
            "new_stock",
            "created_by",
            "created_at",
        ]

    def validate(self, attrs):

        transaction_type = attrs.get("transaction_type")
        quantity = attrs.get("quantity")

        if transaction_type in ["STOCK_IN", "STOCK_OUT"]:
            if quantity < 1:
                raise serializers.ValidationError(
                    {"quantity": "Quantity must be greater than zero."}
                )

        return attrs
