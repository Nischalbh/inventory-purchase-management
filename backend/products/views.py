from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProductSerializer
from .services import ProductService


class ProductListCreateView(APIView):

    def get(self, request):
        products = ProductService.get_all_products()

        serializer = ProductSerializer(products, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)

        if serializer.is_valid():
            product = ProductService.create_product(serializer.validated_data)

            response_serializer = ProductSerializer(product)

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):

    def get_object(self, product_id):
        return ProductService.get_product_by_id(product_id)

    def get(self, request, product_id):
        product = self.get_object(product_id)

        if product is None:
            return Response(
                {"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(product)

        return Response(serializer.data)

    def put(self, request, product_id):
        return self.update_product(request, product_id, partial=False)

    def patch(self, request, product_id):
        return self.update_product(request, product_id, partial=True)

    def update_product(self, request, product_id, partial):
        product = self.get_object(product_id)

        if product is None:
            return Response(
                {"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProductSerializer(product, data=request.data, partial=partial)

        if serializer.is_valid():
            updated_product = ProductService.update_product(
                product, serializer.validated_data
            )

            return Response(ProductSerializer(updated_product).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id):
        product = self.get_object(product_id)

        if product is None:
            return Response(
                {"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND
            )

        ProductService.delete_product(product)

        return Response(status=status.HTTP_204_NO_CONTENT)
