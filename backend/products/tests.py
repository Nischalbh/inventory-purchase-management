from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user
from .models import Product


class ProductPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("product_pager", "ADMIN"))
        self.products = [
            Product.objects.create(
                name=f"Product {index}",
                sku=f"PAGE-{index:03d}",
                category="Category",
                cost_price=1,
                selling_price=2,
            )
            for index in range(25)
        ]

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("product-list-create"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(reverse("product-list-create"), {"page": 2})
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        Product.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("product-list-create"))
        page_two = self.client.get(reverse("product-list-create"), {"page": 2})

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            Product.objects.order_by("-created_at", "-id").values_list("id", flat=True)[
                :20
            ]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(
                    reverse("product-list-create"), {"page": value}
                )
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        Product.objects.all().delete()

        response = self.client.get(reverse("product-list-create"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class ProductCRUDTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("product_crud", "MANAGER"))

    def test_manager_can_create_retrieve_update_and_delete(self):
        create_response = self.client.post(
            reverse("product-list-create"),
            {
                "name": "CRUD Product",
                "sku": "CRUD-001",
                "description": "Created in test",
                "category": "Test",
                "cost_price": "10.00",
                "selling_price": "15.00",
                "current_stock": 5,
                "reorder_level": 2,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        product_id = create_response.data["id"]

        retrieve = self.client.get(reverse("product-detail", args=[product_id]))
        self.assertEqual(retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(retrieve.data["sku"], "CRUD-001")

        update = self.client.patch(
            reverse("product-detail", args=[product_id]),
            {"selling_price": "18.00"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["selling_price"], "18.00")

        delete = self.client.delete(reverse("product-detail", args=[product_id]))
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product_id).exists())

    def test_duplicate_sku_is_rejected(self):
        Product.objects.create(
            name="Existing",
            sku="DUP-001",
            category="Test",
            cost_price=1,
            selling_price=2,
        )

        response = self.client.post(
            reverse("product-list-create"),
            {
                "name": "Duplicate",
                "sku": "dup-001",
                "category": "Test",
                "cost_price": 1,
                "selling_price": 2,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sku", response.data)
