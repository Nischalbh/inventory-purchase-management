from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user
from .models import Supplier


class SupplierPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("supplier_pager", "ADMIN"))
        self.suppliers = [
            Supplier.objects.create(
                name=f"Supplier {index}",
                email=f"supplier{index}@example.com",
                phone="123",
                address="Address",
            )
            for index in range(25)
        ]

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("supplier-list-create"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(reverse("supplier-list-create"), {"page": 2})
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertEqual(len(ids_one), 10)
        self.assertEqual(len(ids_two), 10)
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        Supplier.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("supplier-list-create"))
        page_two = self.client.get(reverse("supplier-list-create"), {"page": 2})

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            Supplier.objects.order_by("-created_at", "-id").values_list("id", flat=True)[
                :20
            ]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(
                    reverse("supplier-list-create"), {"page": value}
                )
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        Supplier.objects.all().delete()

        response = self.client.get(reverse("supplier-list-create"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class SupplierCRUDTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("supplier_crud", "MANAGER"))

    def test_manager_can_create_retrieve_update_and_delete(self):
        create_response = self.client.post(
            reverse("supplier-list-create"),
            {
                "name": "CRUD Supplier",
                "email": "crud_supplier@example.com",
                "phone": "999",
                "address": "CRUD Address",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        supplier_id = create_response.data["id"]

        retrieve = self.client.get(reverse("supplier-detail", args=[supplier_id]))
        self.assertEqual(retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(retrieve.data["name"], "CRUD Supplier")

        update = self.client.patch(
            reverse("supplier-detail", args=[supplier_id]),
            {"name": "Updated Supplier"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["name"], "Updated Supplier")

        delete = self.client.delete(reverse("supplier-detail", args=[supplier_id]))
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Supplier.objects.filter(id=supplier_id).exists())

    def test_missing_supplier_returns_404(self):
        response = self.client.get(reverse("supplier-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
