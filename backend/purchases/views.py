from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsManager
from core.pagination import paginate_api_queryset

from .serializers import PurchaseOrderSerializer, PurchaseOrderItemSerializer
from .services import PurchaseOrderService, PurchaseOrderItemService


class PurchaseOrderListCreateView(APIView):

    permission_classes = [IsManager]

    def get(self, request):
        orders = PurchaseOrderService.get_all_orders()

        paginator, page = paginate_api_queryset(request, orders, self)
        if page is not None:
            serializer = PurchaseOrderSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = PurchaseOrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PurchaseOrderSerializer(data=request.data)

        if serializer.is_valid():
            order = PurchaseOrderService.create_order(serializer.validated_data)

            return Response(
                PurchaseOrderSerializer(order).data, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderDetailView(APIView):

    permission_classes = [IsManager]

    def get(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(PurchaseOrderSerializer(order).data)

    def put(self, request, order_id):
        return self.update_order(request, order_id, False)

    def patch(self, request, order_id):
        return self.update_order(request, order_id, True)

    def update_order(self, request, order_id, partial):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PurchaseOrderSerializer(order, data=request.data, partial=partial)

        if serializer.is_valid():
            updated = PurchaseOrderService.update_order(
                order, serializer.validated_data
            )

            return Response(PurchaseOrderSerializer(updated).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        PurchaseOrderService.delete_order(order)

        return Response(status=status.HTTP_204_NO_CONTENT)


class PurchaseOrderItemListCreateView(APIView):

    permission_classes = [IsManager]

    def get(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        items = PurchaseOrderItemService.get_order_items(order)

        paginator, page = paginate_api_queryset(request, items, self)
        if page is not None:
            serializer = PurchaseOrderItemSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response(PurchaseOrderItemSerializer(items, many=True).data)

    def post(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response(
                {"detail": "Purchase order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.status != "DRAFT":
            return Response(
                {"detail": "Only draft orders can have items added."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PurchaseOrderItemSerializer(data=request.data)

        if serializer.is_valid():
            item = PurchaseOrderItemService.create_item(
                {**serializer.validated_data, "purchase_order": order}
            )

            return Response(
                PurchaseOrderItemSerializer(item).data, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderItemDetailView(APIView):

    permission_classes = [IsManager]

    def get(self, request, item_id):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response(
                {"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(PurchaseOrderItemSerializer(item).data)

    def put(self, request, item_id):
        return self.update_item(request, item_id, False)

    def patch(self, request, item_id):
        return self.update_item(request, item_id, True)

    def update_item(self, request, item_id, partial):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response(
                {"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if item.purchase_order.status != "DRAFT":
            return Response(
                {"detail": "Only draft items can be updated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PurchaseOrderItemSerializer(
            item, data=request.data, partial=partial
        )

        if serializer.is_valid():
            updated = PurchaseOrderItemService.update_item(
                item, serializer.validated_data
            )

            return Response(PurchaseOrderItemSerializer(updated).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, item_id):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response(
                {"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if item.purchase_order.status != "DRAFT":
            return Response(
                {"detail": "Only draft items can be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        PurchaseOrderItemService.delete_item(item)

        return Response(status=status.HTTP_204_NO_CONTENT)
