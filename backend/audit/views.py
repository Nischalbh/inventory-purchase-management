from rest_framework import generics

from accounts.permissions import IsAdmin

from .models import AuditLog
from .serializers import AuditLogSerializer
from .services import AuditLogService


class AuditLogListView(generics.ListAPIView):

    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        action = self.request.query_params.get("action")
        model_name = self.request.query_params.get("model_name")

        return AuditLogService.filter_logs(action=action, model_name=model_name)


class AuditLogDetailView(generics.RetrieveAPIView):

    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return AuditLog.objects.select_related("user").all()
