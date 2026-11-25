from .models import Product


class ProductRepository:

    @staticmethod
    def create(data):
        return Product.objects.create(**data)

    @staticmethod
    def get_all():
        return Product.objects.all().order_by("-created_at", "-id")

    @staticmethod
    def get_by_id(product_id):
        return Product.objects.filter(id=product_id).first()

    @staticmethod
    def update(product, data):
        for field, value in data.items():
            setattr(product, field, value)

        product.save()
        return product

    @staticmethod
    def delete(product):
        product.delete()
