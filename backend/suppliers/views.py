from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsManager

from .serializers import SupplierSerializer
from .services import SupplierService


class SupplierListCreateView(APIView):

    permission_classes = [IsManager]

    def get(self, request):
        suppliers = SupplierService.get_all_suppliers()
        serializer = SupplierSerializer(suppliers, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = SupplierSerializer(data=request.data)

        if serializer.is_valid():
            supplier = SupplierService.create_supplier(serializer.validated_data)

            return Response(
                SupplierSerializer(supplier).data, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierDetailView(APIView):

    permission_classes = [IsManager]

    def get_object(self, supplier_id):
        return SupplierService.get_supplier_by_id(supplier_id)

    def get(self, request, supplier_id):
        supplier = self.get_object(supplier_id)

        if supplier is None:
            return Response(
                {"detail": "Supplier not found."}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(SupplierSerializer(supplier).data)

    def put(self, request, supplier_id):
        return self.update_supplier(request, supplier_id, partial=False)

    def patch(self, request, supplier_id):
        return self.update_supplier(request, supplier_id, partial=True)

    def update_supplier(self, request, supplier_id, partial):
        supplier = self.get_object(supplier_id)

        if supplier is None:
            return Response(
                {"detail": "Supplier not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = SupplierSerializer(supplier, data=request.data, partial=partial)

        if serializer.is_valid():
            updated_supplier = SupplierService.update_supplier(
                supplier, serializer.validated_data
            )

            return Response(SupplierSerializer(updated_supplier).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, supplier_id):
        supplier = self.get_object(supplier_id)

        if supplier is None:
            return Response(
                {"detail": "Supplier not found."}, status=status.HTTP_404_NOT_FOUND
            )

        SupplierService.delete_supplier(supplier)

        return Response(status=status.HTTP_204_NO_CONTENT)
