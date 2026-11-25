from django.db import transaction
from rest_framework.exceptions import ValidationError

from .repositories import InventoryRepository
from notifications.services import NotificationService


class InventoryService:

    @staticmethod
    @transaction.atomic
    def create_transaction(validated_data, user=None):

        product = validated_data["product"]

        transaction_type = validated_data["transaction_type"]

        quantity = validated_data["quantity"]

        notes = validated_data.get("notes", "")

        product = InventoryRepository.get_product_for_update(product.id)

        previous_stock = product.current_stock

        if transaction_type == "STOCK_IN":

            new_stock = previous_stock + quantity

        elif transaction_type == "STOCK_OUT":

            if quantity > previous_stock:
                raise ValidationError({"quantity": "Insufficient stock available."})

            new_stock = previous_stock - quantity

        elif transaction_type == "ADJUSTMENT":

            # For adjustment, quantity means actual counted stock.
            new_stock = quantity

        else:

            raise ValidationError({"transaction_type": "Invalid transaction type."})

        InventoryRepository.update_product_stock(product, new_stock)

        transaction_data = {
            "product": product,
            "transaction_type": transaction_type,
            "quantity": quantity,
            "previous_stock": previous_stock,
            "new_stock": new_stock,
            "notes": notes,
            "created_by": user,
        }

        inventory_transaction = InventoryRepository.create_transaction(transaction_data)

        NotificationService.check_low_stock(product)

        return inventory_transaction

    @staticmethod
    def get_all_transactions():
        return InventoryRepository.get_all_transactions()

    @staticmethod
    def get_transaction_by_id(transaction_id):
        return InventoryRepository.get_transaction_by_id(transaction_id)
