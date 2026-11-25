from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response

from .serializers import InventoryTransactionSerializer
from .services import InventoryService


class InventoryTransactionListCreateView(APIView):

    def get(self, request):

        transactions = InventoryService.get_all_transactions()

        product_id = request.query_params.get("product")
        transaction_type = request.query_params.get("type")

        if product_id:
            transactions = transactions.filter(product_id=product_id)

        if transaction_type:
            transactions = transactions.filter(transaction_type=transaction_type)

        serializer = InventoryTransactionSerializer(transactions, many=True)

        return Response(serializer.data)

    def post(self, request):

        serializer = InventoryTransactionSerializer(data=request.data)

        if serializer.is_valid():

            user = request.user if request.user.is_authenticated else None

            inventory_transaction = InventoryService.create_transaction(
                serializer.validated_data, user
            )

            return Response(
                InventoryTransactionSerializer(inventory_transaction).data, status=201
            )

        return Response(serializer.errors, status=400)


class InventoryTransactionDetailView(APIView):

    def get(self, request, transaction_id):

        inventory_transaction = InventoryService.get_transaction_by_id(transaction_id)

        if not inventory_transaction:
            return Response({"detail": "Transaction not found."}, status=404)

        serializer = InventoryTransactionSerializer(inventory_transaction)

        return Response(serializer.data)
