from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MANAGER = "MANAGER", "Manager"
        STAFF = "STAFF", "staff"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)

    def __str__(self):
        return f"{self.username} ({self.role})"
