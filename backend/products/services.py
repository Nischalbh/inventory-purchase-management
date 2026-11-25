from .repositories import ProductRepository


class ProductService:

    @staticmethod
    def create_product(validated_data):
        return ProductRepository.create(validated_data)

    @staticmethod
    def get_all_products():
        return ProductRepository.get_all()

    @staticmethod
    def get_product_by_id(product_id):
        return ProductRepository.get_by_id(product_id)

    @staticmethod
    def update_product(product, validated_data):
        return ProductRepository.update(product, validated_data)

    @staticmethod
    def delete_product(product):
        return ProductRepository.delete(product)
