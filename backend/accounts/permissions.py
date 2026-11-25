from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsManager(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "MANAGER"]
        )


class IsStaff(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ["ADMIN", "MANAGER", "STAFF"]
        )


class IsAdminOrReadOnly(BasePermission):

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        return request.user.role == "ADMIN"
