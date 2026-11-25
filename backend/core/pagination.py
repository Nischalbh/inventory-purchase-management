"""Pagination helper for plain APIView list endpoints."""

from rest_framework.pagination import PageNumberPagination


def paginate_api_queryset(request, queryset, view):
    """Apply the configured PageNumberPagination to a plain APIView queryset.

    GenericAPIView already provides ``paginate_queryset``; APIView does not, so
    list-only APIViews use this helper to keep the response shape consistent.
    """
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(queryset, request, view=view)
    return paginator, page
