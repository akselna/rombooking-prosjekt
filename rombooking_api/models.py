# rombookingapp/models.py

from django.db import models
from django.contrib.auth.models import User  # Importer Django User-modellen
from encrypted_model_fields.fields import EncryptedCharField




class BrukerDetaljer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    feide_user = models.CharField(max_length=150)
    feide_password = EncryptedCharField(max_length=150)  # Endret her
    email = models.CharField(max_length=150, blank=True, null=True)
    profile_approved = models.BooleanField(default=False)
    

    def __str__(self):
        return self.feide_user


class UserCredentials(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = EncryptedCharField(max_length=500)
    refresh_token = EncryptedCharField(max_length=500)
    token_expiry = models.DateTimeField(null=True)
    scopes = models.TextField()

class Room(models.Model):
    name = models.CharField(max_length=100)
    building = models.CharField(max_length=100)
    image_url = models.URLField(default="https://eloquent-salmiakki-2cbe5c.netlify.app/room_dont_exist.png")  # Ny standardverdi
    capacity = models.IntegerField()
    campus = models.CharField(max_length=100)

class BookingRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Kobling til User
    desired_time = models.TimeField(null=False)
    desired_area = models.CharField(max_length=100, null=True, blank=True)
    desired_date = models.DateField(null=True, blank=True)
    desired_room = models.ForeignKey(Room, on_delete=models.CASCADE, null=False, blank=False)  # Oppdatert til ForeignKey
    desired_building = models.CharField(max_length=100, null=True, blank=True)
    booked_room = models.CharField(max_length=100, null=True, blank=True)
    description = models.CharField(max_length=100, null=False, blank=True)
    status = models.CharField(max_length=20, default='pending')
    progress_delay = models.IntegerField(null=True, blank=True)  # Forsinkelse i sekunder
    created_at = models.DateTimeField(auto_now_add=True)  # Legg til dette feltet
    booking_hour = models.TimeField(null=True, blank=True)
    instant_booking = models.BooleanField(default=False)

    def __str__(self):
        print(self.desired_area, self.desired_time)
        return f"BookingRequest {self.id} - {self.desired_area} kl {self.desired_time}"


def __str__(self):
    return self.name

    
