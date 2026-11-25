from products.models import Product
from .models import InventoryTransaction


class InventoryRepository:

    @staticmethod
    def get_product_for_update(product_id):
        return Product.objects.select_for_update().get(id=product_id)

    @staticmethod
    def update_product_stock(product, new_stock):
        product.current_stock = new_stock

        product.save(update_fields=["current_stock", "updated_at"])

        return product

    @staticmethod
    def create_transaction(data):
        return InventoryTransaction.objects.create(**data)

    @staticmethod
    def get_all_transactions():
        return InventoryTransaction.objects.select_related(
            "product", "created_by"
        ).order_by("-created_at", "-id")

    @staticmethod
    def get_transaction_by_id(transaction_id):
        return (
            InventoryTransaction.objects.select_related("product", "created_by")
            .filter(id=transaction_id)
            .first()
        )
