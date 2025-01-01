from django.contrib import admin
from django.contrib import admin
from .models import Room  # Importer modellen din

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('name', 'building', 'capacity', 'campus')  # Felter som vises

# Register your models here.
