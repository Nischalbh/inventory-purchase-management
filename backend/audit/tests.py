from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user

from .models import AuditLog


class AuditLogPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("audit_pager", "ADMIN"))
        self.logs = [
            AuditLog.objects.create(
                user=None,
                action=(
                    AuditLog.Action.CREATE
                    if index % 2 == 0
                    else AuditLog.Action.UPDATE
                ),
                model_name="Supplier" if index % 2 == 0 else "Product",
                object_id=str(index),
                description=f"Log {index}",
            )
            for index in range(25)
        ]

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("audit-log-list"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(reverse("audit-log-list"), {"page": 2})
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_pagination_preserves_filters(self):
        action_response = self.client.get(
            reverse("audit-log-list"), {"action": AuditLog.Action.CREATE}
        )
        assert_paginated(self, action_response, 13, 1)
        self.assertTrue(
            all(
                item["action"] == AuditLog.Action.CREATE
                for item in action_response.data["results"]
            )
        )

        model_response = self.client.get(
            reverse("audit-log-list"), {"model_name": "Product"}
        )
        assert_paginated(self, model_response, 12, 1)

        combined_page_two = self.client.get(
            reverse("audit-log-list"),
            {"action": AuditLog.Action.CREATE, "page": 2},
        )
        assert_paginated(self, combined_page_two, 13, 2)

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        AuditLog.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("audit-log-list"))
        page_two = self.client.get(reverse("audit-log-list"), {"page": 2})

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            AuditLog.objects.order_by("-created_at", "-id").values_list("id", flat=True)[
                :20
            ]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(reverse("audit-log-list"), {"page": value})
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        AuditLog.objects.all().delete()

        response = self.client.get(reverse("audit-log-list"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class AuditLogAccessTests(APITestCase):

    def setUp(self):
        self.log = AuditLog.objects.create(
            action=AuditLog.Action.CREATE,
            model_name="Supplier",
            object_id="1",
            description="Admin only",
        )

    def test_admin_can_retrieve_log(self):
        client, _ = authenticated_client(create_user("audit_admin", "ADMIN"))

        response = client.get(reverse("audit-log-detail", args=[self.log.pk]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.log.pk)

    def test_manager_and_staff_are_denied(self):
        for role in ["MANAGER", "STAFF"]:
            with self.subTest(role=role):
                client, _ = authenticated_client(create_user(f"audit_{role}", role))
                response = client.get(reverse("audit-log-detail", args=[self.log.pk]))
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
