from .models import Supplier


class SupplierService:

    @staticmethod
    def create_supplier(validated_data):
        return Supplier.objects.create(**validated_data)

    @staticmethod
    def get_all_suppliers():
        return Supplier.objects.all().order_by("-created_at")

    @staticmethod
    def get_supplier_by_id(supplier_id):
        return Supplier.objects.filter(id=supplier_id).first()

    @staticmethod
    def update_supplier(supplier, validated_date):
        for field, value in validated_date.items():
            setattr(supplier, field, value)
        supplier.save()
        return supplier

    @staticmethod
    def delete_supplier(supplier):
        supplier.delete()
