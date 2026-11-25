from .repositories import AuditLogRepository


class AuditLogService:

    @staticmethod
    def create_log(
        user,
        action,
        model_name,
        object_id,
        description="",
        old_data=None,
        new_data=None,
        ip_address=None,
    ):
        data = {
            "user": user,
            "action": action,
            "model_name": model_name,
            "object_id": str(object_id),
            "description": description,
            "old_data": old_data,
            "new_data": new_data,
            "ip_address": ip_address,
        }

        return AuditLogRepository.create(data)

    @staticmethod
    def get_all_logs():
        return AuditLogRepository.get_all()

    @staticmethod
    def get_log_by_id(log_id):
        return AuditLogRepository.get_by_id(log_id)

    @staticmethod
    def filter_logs(action=None, model_name=None):
        logs = AuditLogRepository.get_all()

        if action:
            logs = logs.filter(action=action)

        if model_name:
            logs = logs.filter(model_name=model_name)

        return logs
