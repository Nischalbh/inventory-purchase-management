from rest_framework import serializers

from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)

    line_total = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = PurchaseOrderItem
        fields = [
            "id",
            "purchase_order",
            "product",
            "product_name",
            "quantity",
            "unit_cost",
            "line_total",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["id", "purchase_order", "created_at", "updated_at"]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")

        return value

    def validate_unit_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("Unit cost cannot be negative.")

        return value


class PurchaseOrderSerializer(serializers.ModelSerializer):

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    total_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "order_number",
            "supplier",
            "supplier_name",
            "status",
            "order_date",
            "expected_delivery_date",
            "notes",
            "items",
            "total_amount",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["id", "order_date", "created_at", "updated_at"]
