from .models import Notification
from .repositories import NotificationRepository


class NotificationService:

    @staticmethod
    def check_low_stock(product):

        if product.current_stock <= product.reorder_level:

            existing_notification = (
                NotificationRepository.get_unread_low_stock_notification(product)
            )

            if existing_notification:
                return existing_notification

            return NotificationRepository.create(
                {
                    "title": "Low Stock Alert",
                    "message": (
                        f"{product.name} has only "
                        f"{product.current_stock} units remaining."
                    ),
                    "notification_type": (Notification.NotificationType.LOW_STOCK),
                    "product": product,
                }
            )

        return None

    @staticmethod
    def get_all_notifications():
        return NotificationRepository.get_all()

    @staticmethod
    def get_notification_by_id(notification_id):
        return NotificationRepository.get_by_id(notification_id)

    @staticmethod
    def get_unread_count():
        return NotificationRepository.get_unread_count()

    @staticmethod
    def mark_as_read(notification):
        return NotificationRepository.mark_as_read(notification)
