from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PurchaseOrderSerializer, PurchaseOrderItemSerializer
from .services import PurchaseOrderService, PurchaseOrderItemService


class PurchaseOrderListCreateView(APIView):

    def get(self, request):
        orders = PurchaseOrderService.get_all_orders()
        serializer = PurchaseOrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PurchaseOrderSerializer(data=request.data)

        if serializer.is_valid():
            order = PurchaseOrderService.create_order(serializer.validated_data)
            return Response(PurchaseOrderSerializer(order).data, status=201)

        return Response(serializer.errors, status=400)


class PurchaseOrderDetailView(APIView):

    def get(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response({"detail": "Purchase order not found."}, status=404)

        return Response(PurchaseOrderSerializer(order).data)

    def put(self, request, order_id):
        return self.update_order(request, order_id, False)

    def patch(self, request, order_id):
        return self.update_order(request, order_id, True)

    def update_order(self, request, order_id, partial):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response({"detail": "Purchase order not found."}, status=404)

        serializer = PurchaseOrderSerializer(order, data=request.data, partial=partial)

        if serializer.is_valid():
            updated = PurchaseOrderService.update_order(
                order, serializer.validated_data
            )
            return Response(PurchaseOrderSerializer(updated).data)

        return Response(serializer.errors, status=400)

    def delete(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response({"detail": "Purchase order not found."}, status=404)

        PurchaseOrderService.delete_order(order)
        return Response(status=204)


class PurchaseOrderItemListCreateView(APIView):

    def get(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response({"detail": "Purchase order not found."}, status=404)

        items = PurchaseOrderItemService.get_order_items(order)
        return Response(PurchaseOrderItemSerializer(items, many=True).data)

    def post(self, request, order_id):
        order = PurchaseOrderService.get_order_by_id(order_id)

        if not order:
            return Response({"detail": "Purchase order not found."}, status=404)

        if order.status != "DRAFT":
            return Response(
                {"detail": "Only draft orders can have items added."}, status=400
            )

        serializer = PurchaseOrderItemSerializer(data=request.data)

        if serializer.is_valid():
            item = PurchaseOrderItemService.create_item(
                {**serializer.validated_data, "purchase_order": order}
            )
            return Response(PurchaseOrderItemSerializer(item).data, status=201)

        return Response(serializer.errors, status=400)


class PurchaseOrderItemDetailView(APIView):

    def get(self, request, item_id):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response({"detail": "Item not found."}, status=404)

        return Response(PurchaseOrderItemSerializer(item).data)

    def put(self, request, item_id):
        return self.update_item(request, item_id, False)

    def patch(self, request, item_id):
        return self.update_item(request, item_id, True)

    def update_item(self, request, item_id, partial):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response({"detail": "Item not found."}, status=404)

        if item.purchase_order.status != "DRAFT":
            return Response({"detail": "Only draft items can be updated."}, status=400)

        serializer = PurchaseOrderItemSerializer(
            item, data=request.data, partial=partial
        )

        if serializer.is_valid():
            updated = PurchaseOrderItemService.update_item(
                item, serializer.validated_data
            )
            return Response(PurchaseOrderItemSerializer(updated).data)

        return Response(serializer.errors, status=400)

    def delete(self, request, item_id):
        item = PurchaseOrderItemService.get_item_by_id(item_id)

        if not item:
            return Response({"detail": "Item not found."}, status=404)

        if item.purchase_order.status != "DRAFT":
            return Response({"detail": "Only draft items can be deleted."}, status=400)

        PurchaseOrderItemService.delete_item(item)
        return Response(status=204)
