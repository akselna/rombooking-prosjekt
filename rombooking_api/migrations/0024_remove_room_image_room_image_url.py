# Generated by Django 5.1.2 on 2024-12-29 18:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rombooking_api', '0023_remove_brukerdetaljer_last_activity'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='room',
            name='image',
        ),
        migrations.AddField(
            model_name='room',
            name='image_url',
            field=models.URLField(default='https://eloquent-salmiakki-2cbe5c.netlify.app/03-074.jpeg'),
            preserve_default=False,
        ),
    ]
