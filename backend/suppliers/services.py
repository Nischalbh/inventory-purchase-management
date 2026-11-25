from .repositories import SupplierRepository


class SupplierService:

    @staticmethod
    def create_supplier(validated_data):
        return SupplierRepository.create(validated_data)

    @staticmethod
    def get_all_suppliers():
        return SupplierRepository.get_all()

    @staticmethod
    def get_supplier_by_id(supplier_id):
        return SupplierRepository.get_by_id(supplier_id)

    @staticmethod
    def update_supplier(supplier, validated_data):
        return SupplierRepository.update(supplier, validated_data)

    @staticmethod
    def delete_supplier(supplier):
        return SupplierRepository.delete(supplier)
