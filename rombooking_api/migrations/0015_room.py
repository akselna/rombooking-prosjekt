# Generated by Django 5.1.2 on 2024-12-22 22:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rombooking_api', '0014_alter_brukerdetaljer_feide_password'),
    ]

    operations = [
        migrations.CreateModel(
            name='Room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('building', models.CharField(max_length=100)),
                ('image', models.ImageField(upload_to='rooms/')),
                ('description', models.TextField()),
                ('capacity', models.IntegerField()),
                ('campus', models.CharField(max_length=100)),
            ],
        ),
    ]
