from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import NotificationSerializer
from .services import NotificationService


class NotificationListView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = NotificationService.get_all_notifications()

        serializer = NotificationSerializer(notifications, many=True)

        return Response(serializer.data)


class NotificationDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, notification_id):
        notification = NotificationService.get_notification_by_id(notification_id)

        if not notification:
            return Response({"detail": "Notification not found."}, status=404)

        return Response(NotificationSerializer(notification).data)

    def patch(self, request, notification_id):
        notification = NotificationService.get_notification_by_id(notification_id)

        if not notification:
            return Response({"detail": "Notification not found."}, status=404)

        notification = NotificationService.mark_as_read(notification)

        return Response(NotificationSerializer(notification).data)


class UnreadNotificationCountView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationService.get_unread_count()

        return Response({"unread_count": count})
