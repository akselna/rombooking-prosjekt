# Generated by Django 5.1.1 on 2024-09-26 14:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rombooking_api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bookingrequest',
            name='desired_time',
            field=models.TimeField(),
        ),
        migrations.AlterField(
            model_name='bookingrequest',
            name='status',
            field=models.CharField(default='pending', max_length=20),
        ),
    ]
