from django.test import TestCase

# Create your tests here.

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from audit.models import AuditLog
from core.api_test_helpers import (
    TEST_PASSWORD,
    authenticated_client,
    create_user,
    tokens_for,
)
from inventory.models import InventoryTransaction
from notifications.models import Notification
from products.models import Product
from purchases.models import PurchaseOrder, PurchaseOrderItem
from suppliers.models import Supplier

User = get_user_model()


class JWTAuthenticationTests(APITestCase):

    def test_registration_hashes_password_and_forces_staff_role(self):
        password = "N3w!User#Pass2026"

        response = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": password,
                "confirm_password": password,
                "role": "ADMIN",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", response.data)
        self.assertNotIn("confirm_password", response.data)
        self.assertEqual(response.data["role"], "STAFF")

        user = User.objects.get(username="newuser")
        self.assertEqual(user.role, "STAFF")
        self.assertNotEqual(user.password, password)
        self.assertTrue(user.check_password(password))

    def test_registration_rejects_mismatched_passwords(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "mismatch",
                "email": "mismatch@example.com",
                "password": TEST_PASSWORD,
                "confirm_password": "Different!123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)
        self.assertFalse(User.objects.filter(username="mismatch").exists())

    def test_registration_rejects_weak_password(self):
        response = self.client.post(
            reverse("register"),
            {
                "username": "weakuser",
                "email": "weakuser@example.com",
                "password": "12345678",
                "confirm_password": "12345678",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="weakuser").exists())

    def test_login_returns_valid_access_and_refresh_tokens(self):
        user = create_user("loginuser")

        response = self.client.post(
            reverse("token_obtain_pair"),
            {"username": user.username, "password": TEST_PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        access = AccessToken(response.data["access"])
        refresh = RefreshToken(response.data["refresh"])

        self.assertEqual(access["token_type"], "access")
        self.assertEqual(str(access["user_id"]), str(user.id))
        self.assertEqual(refresh["token_type"], "refresh")
        self.assertEqual(str(refresh["user_id"]), str(user.id))

    def test_access_token_authenticates_profile(self):
        user = create_user("profileuser", role="MANAGER")
        tokens = tokens_for(user)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], user.username)
        self.assertEqual(response.data["email"], user.email)
        self.assertEqual(response.data["role"], "MANAGER")
        self.assertNotIn("password", response.data)

    def test_profile_without_credentials_returns_401(self):
        self.client.credentials()

        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(
            response.data["detail"], "Authentication credentials were not provided."
        )

    def test_malformed_token_is_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid.token.value")

        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "token_not_valid")
        self.assertIn("Given token not valid for any token type", str(response.data))

    def test_expired_access_token_is_rejected(self):
        user = create_user("expireduser")
        token = AccessToken.for_user(user)
        token.set_exp(lifetime=timedelta(seconds=-1))

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "token_not_valid")

    def test_refresh_token_cannot_authenticate_protected_endpoint(self):
        user = create_user("wrongtypeuser")
        refresh = tokens_for(user)["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh}")
        response = self.client.get(reverse("profile"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "token_not_valid")
        self.assertIn("Given token not valid for any token type", str(response.data))

    def test_refresh_token_issues_new_access_token_and_rotates(self):
        user = create_user("refreshuser")
        tokens = tokens_for(user)

        response = self.client.post(
            reverse("token_refresh"), {"refresh": tokens["refresh"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotEqual(response.data["access"], tokens["access"])
        self.assertIn("refresh", response.data)

        replay = self.client.post(
            reverse("token_refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(replay.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(replay.data["code"], "token_not_valid")

    def test_access_token_is_rejected_by_refresh_endpoint(self):
        user = create_user("refreshwrongtype")
        tokens = tokens_for(user)

        response = self.client.post(
            reverse("token_refresh"), {"refresh": tokens["access"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["code"], "token_not_valid")

    def test_logout_blacklists_own_refresh_token(self):
        user = create_user("logoutuser")
        client, tokens = authenticated_client(user)

        response = client.post(
            reverse("logout"), {"refresh": tokens["refresh"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_response = self.client.post(
            reverse("token_refresh"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(refresh_response.data["code"], "token_not_valid")

    def test_logout_requires_refresh_token(self):
        user = create_user("logoutmissing")
        client, _ = authenticated_client(user)

        response = client.post(reverse("logout"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Refresh token is required.")

    def test_logout_rejects_invalid_refresh_token(self):
        user = create_user("logoutinvalid")
        client, _ = authenticated_client(user)

        response = client.post(
            reverse("logout"), {"refresh": "invalid.token.value"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid or expired refresh token.")

    def test_logout_rejects_expired_refresh_token(self):
        user = create_user("logoutexpired")
        token = RefreshToken.for_user(user)
        token.set_exp(lifetime=timedelta(seconds=-1))
        client, _ = authenticated_client(user)

        response = client.post(
            reverse("logout"), {"refresh": str(token)}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Invalid or expired refresh token.")

    def test_logout_rejects_blacklisted_refresh_token(self):
        user = create_user("logoutblacklisted")
        client, tokens = authenticated_client(user)

        first = client.post(
            reverse("logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(first.status_code, status.HTTP_205_RESET_CONTENT)

        second = client.post(
            reverse("logout"), {"refresh": tokens["refresh"]}, format="json"
        )
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(second.data["detail"], "Invalid or expired refresh token.")

    def test_logout_rejects_another_users_refresh_token(self):
        owner = create_user("tokenowner")
        victim = create_user("tokenvictim", role="MANAGER")
        victim_tokens = tokens_for(victim)
        client, _ = authenticated_client(owner)

        response = client.post(
            reverse("logout"), {"refresh": victim_tokens["refresh"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data["detail"], "You cannot log out another user's token."
        )

        still_valid = self.client.post(
            reverse("token_refresh"),
            {"refresh": victim_tokens["refresh"]},
            format="json",
        )
        self.assertEqual(still_valid.status_code, status.HTTP_200_OK)


class RBACTests(APITestCase):

    def setUp(self):
        self.admin = create_user("rbac_admin", "ADMIN")
        self.manager = create_user("rbac_manager", "MANAGER")
        self.staff = create_user("rbac_staff", "STAFF")
        self.users = {
            "ADMIN": self.admin,
            "MANAGER": self.manager,
            "STAFF": self.staff,
        }

        self.supplier = Supplier.objects.create(
            name="Supplier", email="supplier@example.com", phone="1", address="A"
        )
        self.product = Product.objects.create(
            name="Product",
            sku="RBAC-1",
            category="Cat",
            cost_price=1,
            selling_price=2,
        )
        self.order = PurchaseOrder.objects.create(
            order_number="PO-RBAC-1", supplier=self.supplier
        )
        self.item = PurchaseOrderItem.objects.create(
            purchase_order=self.order,
            product=self.product,
            quantity=1,
            unit_cost=1,
        )
        self.transaction = InventoryTransaction.objects.create(
            product=self.product,
            transaction_type=InventoryTransaction.TransactionType.STOCK_IN,
            quantity=1,
            previous_stock=0,
            new_stock=1,
            created_by=self.admin,
        )
        self.notification = Notification.objects.create(title="Note", message="Msg")
        self.audit_log = AuditLog.objects.create(
            user=self.admin,
            action=AuditLog.Action.CREATE,
            model_name="Supplier",
            object_id=str(self.supplier.pk),
        )

        all_roles = {"ADMIN", "MANAGER", "STAFF"}
        manager_roles = {"ADMIN", "MANAGER"}

        self.endpoints = [
            (reverse("supplier-list-create"), manager_roles),
            (reverse("supplier-detail", args=[self.supplier.pk]), manager_roles),
            (reverse("product-list-create"), manager_roles),
            (reverse("product-detail", args=[self.product.pk]), manager_roles),
            (reverse("purchase-order-list-create"), manager_roles),
            (reverse("purchase-order-detail", args=[self.order.pk]), manager_roles),
            (
                reverse("purchase-order-item-list-create", args=[self.order.pk]),
                manager_roles,
            ),
            (
                reverse("purchase-order-item-detail", args=[self.item.pk]),
                manager_roles,
            ),
            (reverse("inventory-transaction-list-create"), all_roles),
            (
                reverse("inventory-transaction-detail", args=[self.transaction.pk]),
                all_roles,
            ),
            (reverse("notification-list"), all_roles),
            (reverse("unread-notification-count"), all_roles),
            (reverse("notification-detail", args=[self.notification.pk]), all_roles),
            (reverse("audit-log-list"), {"ADMIN"}),
            (reverse("audit-log-detail", args=[self.audit_log.pk]), {"ADMIN"}),
        ]

    def test_anonymous_users_receive_401(self):
        self.client.credentials()

        for url, _ in self.endpoints:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_roles_receive_expected_access(self):
        for role, user in self.users.items():
            client, _ = authenticated_client(user)

            for url, allowed_roles in self.endpoints:
                with self.subTest(role=role, url=url):
                    response = client.get(url)
                    if role in allowed_roles:
                        self.assertEqual(response.status_code, status.HTTP_200_OK)
                    else:
                        self.assertEqual(
                            response.status_code, status.HTTP_403_FORBIDDEN
                        )

    def test_profile_is_available_to_all_roles(self):
        for role, user in self.users.items():
            with self.subTest(role=role):
                client, _ = authenticated_client(user)
                response = client.get(reverse("profile"))
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["role"], role)
                self.assertNotIn("password", response.data)

    def test_staff_cannot_mutate_manager_modules(self):
        client, _ = authenticated_client(self.staff)

        response = client.post(
            reverse("supplier-list-create"),
            {
                "name": "Blocked",
                "email": "blocked@example.com",
                "phone": "1",
                "address": "A",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        for method, url, data in [
            ("put", reverse("supplier-detail", args=[self.supplier.pk]), {"name": "X"}),
            (
                "patch",
                reverse("supplier-detail", args=[self.supplier.pk]),
                {"name": "X"},
            ),
        ]:
            with self.subTest(method=method):
                response = getattr(client, method)(url, data, format="json")
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = client.delete(reverse("supplier-detail", args=[self.supplier.pk]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        for url in [
            reverse("product-list-create"),
            reverse("purchase-order-list-create"),
            reverse("purchase-order-item-list-create", args=[self.order.pk]),
        ]:
            with self.subTest(url=url):
                response = client.post(url, {}, format="json")
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_mutate_manager_modules(self):
        client, _ = authenticated_client(self.manager)

        response = client.post(
            reverse("supplier-list-create"),
            {
                "name": "Allowed",
                "email": "allowed@example.com",
                "phone": "1",
                "address": "A",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        supplier_id = response.data["id"]

        response = client.patch(
            reverse("supplier-detail", args=[supplier_id]),
            {"name": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = client.delete(reverse("supplier-detail", args=[supplier_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_manager_cannot_access_audit_logs(self):
        client, _ = authenticated_client(self.manager)

        self.assertEqual(
            client.get(reverse("audit-log-list")).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            client.get(
                reverse("audit-log-detail", args=[self.audit_log.pk])
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
