from .repositories import PurchaseOrderRepository, PurchaseOrderItemRepository


class PurchaseOrderService:

    @staticmethod
    def create_order(data):
        return PurchaseOrderRepository.create(data)

    @staticmethod
    def get_all_orders():
        return PurchaseOrderRepository.get_all()

    @staticmethod
    def get_order_by_id(order_id):
        return PurchaseOrderRepository.get_by_id(order_id)

    @staticmethod
    def update_order(order, data):
        return PurchaseOrderRepository.update(order, data)

    @staticmethod
    def delete_order(order):
        return PurchaseOrderRepository.delete(order)


class PurchaseOrderItemService:

    @staticmethod
    def create_item(data):
        return PurchaseOrderItemRepository.create(data)

    @staticmethod
    def get_order_items(order):
        return PurchaseOrderItemRepository.get_by_order(order)

    @staticmethod
    def get_item_by_id(item_id):
        return PurchaseOrderItemRepository.get_by_id(item_id)

    @staticmethod
    def update_item(item, data):
        return PurchaseOrderItemRepository.update(item, data)

    @staticmethod
    def delete_item(item):
        return PurchaseOrderItemRepository.delete(item)
