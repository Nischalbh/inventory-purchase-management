from .models import Supplier


class SupplierRepository:

    @staticmethod
    def create(data):
        return Supplier.objects.create(**data)

    @staticmethod
    def get_all():
        return Supplier.objects.all().order_by("-created_at")

    @staticmethod
    def get_by_id(supplier_id):
        return Supplier.objects.filter(id=supplier_id).first()

    @staticmethod
    def update(supplier, data):
        for field, value in data.items():
            setattr(supplier, field, value)
            supplier.save()
            return supplier

    @staticmethod
    def delete(supplier):
        supplier.delete()
