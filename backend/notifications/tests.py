from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from core.api_test_helpers import assert_paginated, authenticated_client, create_user

from .models import Notification


class NotificationPaginationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("notification_pager", "STAFF"))
        self.notifications = [
            Notification.objects.create(
                title=f"Notification {index}", message=f"Message {index}"
            )
            for index in range(25)
        ]

    def test_page_one_and_page_two_are_paginated_without_duplicates(self):
        page_one = self.client.get(reverse("notification-list"))
        assert_paginated(self, page_one, 25, 1)

        page_two = self.client.get(reverse("notification-list"), {"page": 2})
        assert_paginated(self, page_two, 25, 2)

        ids_one = [item["id"] for item in page_one.data["results"]]
        ids_two = [item["id"] for item in page_two.data["results"]]
        self.assertFalse(set(ids_one) & set(ids_two))

    def test_equal_timestamps_have_stable_order(self):
        fixed_time = timezone.now()
        Notification.objects.update(created_at=fixed_time)

        page_one = self.client.get(reverse("notification-list"))
        page_two = self.client.get(reverse("notification-list"), {"page": 2})

        actual_ids = [item["id"] for item in page_one.data["results"]] + [
            item["id"] for item in page_two.data["results"]
        ]
        expected_ids = list(
            Notification.objects.order_by("-created_at", "-id").values_list(
                "id", flat=True
            )[:20]
        )
        self.assertEqual(actual_ids, expected_ids)

    def test_invalid_pages_return_404(self):
        for value in ["abc", "0", "999"]:
            with self.subTest(value=value):
                response = self.client.get(reverse("notification-list"), {"page": value})
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_dataset_returns_empty_results(self):
        Notification.objects.all().delete()

        response = self.client.get(reverse("notification-list"))

        assert_paginated(self, response, 0, 1)
        self.assertEqual(response.data["results"], [])


class NotificationTests(APITestCase):

    def setUp(self):
        self.client, _ = authenticated_client(create_user("notification_crud", "STAFF"))
        self.notification = Notification.objects.create(
            title="Low Stock", message="Please restock"
        )

    def test_retrieve_notification(self):
        response = self.client.get(
            reverse("notification-detail", args=[self.notification.pk])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Low Stock")

    def test_patch_marks_notification_as_read(self):
        response = self.client.patch(
            reverse("notification-detail", args=[self.notification.pk]),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_read"])
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_unread_count(self):
        Notification.objects.create(title="Read me", message="Unread", is_read=True)

        response = self.client.get(reverse("unread-notification-count"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 1)
