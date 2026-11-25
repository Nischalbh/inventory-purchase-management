"""Reusable helpers for DRF API tests."""

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

TEST_PASSWORD = "Str0ng!Passw0rd#2026"


def create_user(username, role="STAFF", email=None, password=TEST_PASSWORD):
    return User.objects.create_user(
        username=username,
        email=email or f"{username}@example.com",
        password=password,
        role=role,
    )


def tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


def authenticated_client(user):
    client = APIClient()
    tokens = tokens_for(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client, tokens


def assert_paginated(test_case, response, total, page, page_size=10):
    """Assert the PageNumberPagination response shape and current page size."""
    data = response.data

    test_case.assertIn("count", data)
    test_case.assertIn("next", data)
    test_case.assertIn("previous", data)
    test_case.assertIn("results", data)
    test_case.assertEqual(data["count"], total)
    test_case.assertIsInstance(data["results"], list)

    remaining = max(total - (page - 1) * page_size, 0)
    test_case.assertEqual(len(data["results"]), min(page_size, remaining))

    if page == 1:
        test_case.assertIsNone(data["previous"])
    else:
        test_case.assertIsNotNone(data["previous"])

    if total > page * page_size:
        test_case.assertIsNotNone(data["next"])
        test_case.assertIn(f"page={page + 1}", data["next"])
    else:
        test_case.assertIsNone(data["next"])
