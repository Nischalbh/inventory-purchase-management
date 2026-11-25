from django.test import TestCase

# Create your tests here.

from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user
from products.models import Product
from suppliers.models import Supplier

from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("order_pager", "ADMIN"))
        self.supplier = Supplier.objects.create(
            name="Pagination Supplier",
            email="order_pager_supplier@example.com",
            phone="123",
            address="Address",
        )
        self.orders = [
            PurchaseOrder.objects.create(
                order_number=f"PO-PAGE-{index:03d}", supplier=self.supplier
            )
            for index in range(25)
        ]

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("purchase-order-list-create"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(reverse("purchase-order-list-create"), {"page": 2})
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        PurchaseOrder.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("purchase-order-list-create"))
        page_two = self.client.get(reverse("purchase-order-list-create"), {"page": 2})

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            PurchaseOrder.objects.order_by("-created_at", "-id").values_list(
                "id", flat=True
            )[:20]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(
                    reverse("purchase-order-list-create"), {"page": value}
                )
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        PurchaseOrder.objects.all().delete()

        response = self.client.get(reverse("purchase-order-list-create"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class PurchaseOrderItemPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("item_pager", "ADMIN"))
        self.supplier = Supplier.objects.create(
            name="Item Page Supplier",
            email="item_pager_supplier@example.com",
            phone="123",
            address="Address",
        )
        self.order = PurchaseOrder.objects.create(
            order_number="PO-ITEM-PAGE", supplier=self.supplier
        )
        for index in range(12):
            product = Product.objects.create(
                name=f"Item Product {index}",
                sku=f"ITEM-PAGE-{index:03d}",
                category="Test",
                cost_price=1,
                selling_price=2,
            )
            PurchaseOrderItem.objects.create(
                purchase_order=self.order,
                product=product,
                quantity=1,
                unit_cost=Decimal("1.00"),
            )

    def test_item_list_is_paginated(self):
        page_one = self.client.get(
            reverse("purchase-order-item-list-create", args=[self.order.pk])
        )
        assert_paginated(self, page_one, 12, 1)

        page_two = self.client.get(
            reverse("purchase-order-item-list-create", args=[self.order.pk]),
            {"page": 2},
        )
        assert_paginated(self, page_two, 12, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))


class PurchaseCRUDTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("purchase_crud", "MANAGER"))
        self.supplier = Supplier.objects.create(
            name="CRUD Supplier",
            email="purchase_crud_supplier@example.com",
            phone="123",
            address="Address",
        )
        self.product = Product.objects.create(
            name="CRUD Product",
            sku="PURCHASE-CRUD-001",
            category="Test",
            cost_price=1,
            selling_price=2,
        )

    def test_order_crud(self):
        create_response = self.client.post(
            reverse("purchase-order-list-create"),
            {
                "order_number": "PO-CRUD-001",
                "supplier": self.supplier.pk,
                "status": "DRAFT",
                "notes": "Created in test",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        order_id = create_response.data["id"]

        retrieve = self.client.get(reverse("purchase-order-detail", args=[order_id]))
        self.assertEqual(retrieve.status_code, status.HTTP_200_OK)
        self.assertEqual(retrieve.data["order_number"], "PO-CRUD-001")

        update = self.client.patch(
            reverse("purchase-order-detail", args=[order_id]),
            {"status": "SUBMITTED"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["status"], "SUBMITTED")

        delete = self.client.delete(reverse("purchase-order-detail", args=[order_id]))
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PurchaseOrder.objects.filter(id=order_id).exists())

    def test_item_crud_on_draft_order(self):
        order = PurchaseOrder.objects.create(
            order_number="PO-CRUD-ITEMS", supplier=self.supplier
        )

        create_response = self.client.post(
            reverse("purchase-order-item-list-create", args=[order.pk]),
            {"product": self.product.pk, "quantity": 3, "unit_cost": "5.00"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        item_id = create_response.data["id"]

        retrieve = self.client.get(reverse("purchase-order-item-detail", args=[item_id]))
        self.assertEqual(retrieve.status_code, status.HTTP_200_OK)

        update = self.client.patch(
            reverse("purchase-order-item-detail", args=[item_id]),
            {"quantity": 4},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["quantity"], 4)

        delete = self.client.delete(
            reverse("purchase-order-item-detail", args=[item_id])
        )
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PurchaseOrderItem.objects.filter(id=item_id).exists())

    def test_items_cannot_be_added_to_non_draft_order(self):
        order = PurchaseOrder.objects.create(
            order_number="PO-CRUD-SUBMITTED",
            supplier=self.supplier,
            status="SUBMITTED",
        )

        response = self.client.post(
            reverse("purchase-order-item-list-create", args=[order.pk]),
            {"product": self.product.pk, "quantity": 1, "unit_cost": "5.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
