# Generated by Django 5.1.2 on 2024-12-22 22:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('rombooking_api', '0015_room'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='description',
        ),
    ]