import json

from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.forms.models import model_to_dict
from django.core.serializers.json import DjangoJSONEncoder

from suppliers.models import Supplier
from products.models import Product
from purchases.models import PurchaseOrder, PurchaseOrderItem
from inventory.models import InventoryTransaction

from .models import AuditLog
from .middleware import get_current_request

TRACKED_MODELS = [
    Supplier,
    Product,
    PurchaseOrder,
    PurchaseOrderItem,
    InventoryTransaction,
]


def serialize_instance(instance):
    data = model_to_dict(instance)
    return json.loads(json.dumps(data, cls=DjangoJSONEncoder))


def get_request_details():
    request = get_current_request()

    user = None
    ip_address = None

    if request:
        if request.user.is_authenticated:
            user = request.user

        forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")

        if forwarded_for:
            ip_address = forwarded_for.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

    return user, ip_address


@receiver(pre_save)
def capture_old_data(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    if not instance.pk:
        instance._audit_old_data = None
        return

    try:
        old_instance = sender.objects.get(pk=instance.pk)
        instance._audit_old_data = serialize_instance(old_instance)

    except sender.DoesNotExist:
        instance._audit_old_data = None


@receiver(post_save)
def create_audit_log(sender, instance, created, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    old_data = getattr(instance, "_audit_old_data", None)
    new_data = serialize_instance(instance)

    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE

    user, ip_address = get_request_details()

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        description=f"{sender.__name__} {action.lower()}d",
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address,
    )


@receiver(pre_delete)
def create_delete_audit_log(sender, instance, **kwargs):
    if sender not in TRACKED_MODELS:
        return

    old_data = serialize_instance(instance)
    user, ip_address = get_request_details()

    AuditLog.objects.create(
        user=user,
        action=AuditLog.Action.DELETE,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        description=f"{sender.__name__} deleted",
        old_data=old_data,
        new_data=None,
        ip_address=ip_address,
    )
