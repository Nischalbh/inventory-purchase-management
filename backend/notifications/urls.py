from django.urls import path

from .views import (
    NotificationListView,
    NotificationDetailView,
    UnreadNotificationCountView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path(
        "unread-count/",
        UnreadNotificationCountView.as_view(),
        name="unread-notification-count",
    ),
    path(
        "<int:notification_id>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
]
