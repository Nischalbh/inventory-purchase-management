from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user
from products.models import Product

from .models import InventoryTransaction
from .services import InventoryService


class InventoryPaginationTests(APITestCase):

    def setUp(self):
        self.user = create_user("inventory_pager", "STAFF")
        self.client, _ = authenticated_client(self.user)
        self.product = Product.objects.create(
            name="Inventory Product",
            sku="INVENTORY-PAGE-001",
            category="Test",
            cost_price=1,
            selling_price=2,
            current_stock=100,
        )

        for index in range(25):
            transaction_type = (
                InventoryTransaction.TransactionType.STOCK_IN
                if index % 2 == 0
                else InventoryTransaction.TransactionType.STOCK_OUT
            )
            InventoryService.create_transaction(
                {
                    "product": self.product,
                    "transaction_type": transaction_type,
                    "quantity": 1,
                    "notes": f"Transaction {index}",
                },
                self.user,
            )

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("inventory-transaction-list-create"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(
            reverse("inventory-transaction-list-create"), {"page": 2}
        )
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_pagination_preserves_filters(self):
        product_response = self.client.get(
            reverse("inventory-transaction-list-create"),
            {"product": self.product.pk},
        )
        assert_paginated(self, product_response, 25, 1)

        type_response = self.client.get(
            reverse("inventory-transaction-list-create"),
            {"type": InventoryTransaction.TransactionType.STOCK_IN},
        )
        assert_paginated(self, type_response, 13, 1)
        self.assertTrue(
            all(
                item["transaction_type"]
                == InventoryTransaction.TransactionType.STOCK_IN
                for item in type_response.data["results"]
            )
        )

        combined_page_two = self.client.get(
            reverse("inventory-transaction-list-create"),
            {
                "type": InventoryTransaction.TransactionType.STOCK_IN,
                "page": 2,
            },
        )
        assert_paginated(self, combined_page_two, 13, 2)

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        InventoryTransaction.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("inventory-transaction-list-create"))
        page_two = self.client.get(
            reverse("inventory-transaction-list-create"), {"page": 2}
        )

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            InventoryTransaction.objects.order_by("-created_at", "-id").values_list(
                "id", flat=True
            )[:20]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(
                    reverse("inventory-transaction-list-create"), {"page": value}
                )
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        InventoryTransaction.objects.all().delete()

        response = self.client.get(reverse("inventory-transaction-list-create"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class InventoryTransactionTests(APITestCase):

    def setUp(self):
        self.user = create_user("inventory_crud", "STAFF")
        self.client, _ = authenticated_client(self.user)
        self.product = Product.objects.create(
            name="Stock Product",
            sku="INVENTORY-CRUD-001",
            category="Test",
            cost_price=1,
            selling_price=2,
            current_stock=10,
        )

    def test_post_stock_in_uses_inventory_service_and_updates_stock(self):
        response = self.client.post(
            reverse("inventory-transaction-list-create"),
            {
                "product": self.product.pk,
                "transaction_type": InventoryTransaction.TransactionType.STOCK_IN,
                "quantity": 2,
                "notes": "API test",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["previous_stock"], 10)
        self.assertEqual(response.data["new_stock"], 12)
        self.assertEqual(response.data["created_by"], self.user.pk)

        self.product.refresh_from_db()
        self.assertEqual(self.product.current_stock, 12)

    def test_post_stock_out_rejects_insufficient_stock(self):
        response = self.client.post(
            reverse("inventory-transaction-list-create"),
            {
                "product": self.product.pk,
                "transaction_type": InventoryTransaction.TransactionType.STOCK_OUT,
                "quantity": 99,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

        self.product.refresh_from_db()
        self.assertEqual(self.product.current_stock, 10)

    def test_retrieve_transaction(self):
        transaction = InventoryService.create_transaction(
            {
                "product": self.product,
                "transaction_type": InventoryTransaction.TransactionType.STOCK_IN,
                "quantity": 3,
            },
            self.user,
        )

        response = self.client.get(
            reverse("inventory-transaction-detail", args=[transaction.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], transaction.pk)
