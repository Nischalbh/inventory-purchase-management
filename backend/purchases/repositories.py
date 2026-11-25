from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderRepository:

    @staticmethod
    def create(data):
        return PurchaseOrder.objects.create(**data)

    @staticmethod
    def get_all():
        return (
            PurchaseOrder.objects.select_related("supplier")
            .prefetch_related("items__product")
            .order_by("-created_at")
        )

    @staticmethod
    def get_by_id(order_id):
        return (
            PurchaseOrder.objects.select_related("supplier")
            .prefetch_related("items__product")
            .filter(id=order_id)
            .first()
        )

    @staticmethod
    def update(order, data):
        for field, value in data.items():
            setattr(order, field, value)

        order.save()
        return order

    @staticmethod
    def delete(order):
        order.delete()


class PurchaseOrderItemRepository:

    @staticmethod
    def create(data):
        return PurchaseOrderItem.objects.create(**data)

    @staticmethod
    def get_by_order(order):
        return PurchaseOrderItem.objects.filter(purchase_order=order).select_related(
            "product"
        )

    @staticmethod
    def get_by_id(item_id):
        return (
            PurchaseOrderItem.objects.select_related("purchase_order", "product")
            .filter(id=item_id)
            .first()
        )

    @staticmethod
    def update(item, data):
        for field, value in data.items():
            setattr(item, field, value)

        item.save()
        return item

    @staticmethod
    def delete(item):
        item.delete()
