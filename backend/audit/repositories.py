from .models import AuditLog


class AuditLogRepository:

    @staticmethod
    def create(data):
        return AuditLog.objects.create(**data)

    @staticmethod
    def get_all():
        return AuditLog.objects.select_related("user").all()

    @staticmethod
    def get_by_id(log_id):
        return AuditLog.objects.select_related("user").filter(id=log_id).first()

    @staticmethod
    def filter_by_action(action):
        return AuditLog.objects.select_related("user").filter(action=action)

    @staticmethod
    def filter_by_model(model_name):
        return AuditLog.objects.select_related("user").filter(model_name=model_name)
