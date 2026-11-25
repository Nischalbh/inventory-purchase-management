from .models import Notification


class NotificationRepository:

    @staticmethod
    def create(data):
        return Notification.objects.create(**data)

    @staticmethod
    def get_all():
        return Notification.objects.select_related("product").order_by(
            "-created_at", "-id"
        )

    @staticmethod
    def get_by_id(notification_id):
        return Notification.objects.filter(id=notification_id).first()

    @staticmethod
    def get_unread_count():
        return Notification.objects.filter(is_read=False).count()

    @staticmethod
    def get_unread_low_stock_notification(product):
        return Notification.objects.filter(
            product=product,
            notification_type=Notification.NotificationType.LOW_STOCK,
            is_read=False,
        ).first()

    @staticmethod
    def mark_as_read(notification):
        notification.is_read = True

        notification.save(update_fields=["is_read"])

        return notification
