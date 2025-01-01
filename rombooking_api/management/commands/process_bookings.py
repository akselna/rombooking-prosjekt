# management/commands/process_bookings.py

from django.core.management.base import BaseCommand
from django.utils import timezone
import pytz
from datetime import datetime, timedelta
import random
import time
from django.contrib.auth.models import User
from rombooking_api.utils import add_event_to_google_calendar
from django.core.management.base import BaseCommand
from rombooking_api.models import BookingRequest
from rombooking_api.tasks import book_room_test
from django.utils import timezone
from datetime import timedelta
import time
import random
import pytz

class Command(BaseCommand):
    help = 'Prosesserer ubehandlede bookingforespørsler'

    def handle(self, *args, **kwargs):
        future_date = timezone.now().astimezone(pytz.timezone('Europe/Oslo')).date() + timedelta(days=14)
        unprocessed_requests = BookingRequest.objects.filter(status='pending', desired_date=future_date)
        current_hour = timezone.now().astimezone(pytz.timezone('Europe/Oslo')).hour
        for request in unprocessed_requests:
            print(request.booking_hour.hour, current_hour)
            if request.booking_hour.hour == current_hour:
                try:
                    booking_delay = random.randint(0, 10 * 60)  # Mellom 0 og 10 minutter
                    print(f"Bestillingen gjøres klokken {(timezone.now().astimezone(pytz.timezone('Europe/Oslo')) + timedelta(seconds=booking_delay)).strftime('%H:%M')} minutter før neste booking.")
                    request.progress_delay = booking_delay
                    request.save()
                    time.sleep(booking_delay)
                    request.status = 'processing'
                    request.save()
                    booking_details = book_room_test(request)
                    request.status = 'confirmed'
                    request.booked_room = booking_details['room']
                    request.progress = (f"Booket rom: {booking_details['room']} på {request.desired_building}, på datoen {request.desired_date} klokken {request.desired_time.strftime('%H:%M')}.")
                    request.save()
                    
                    # Hent brukeren
                    user = request.user 

                    # Forbered bookingdetaljer for kalenderhendelsen
                    start_datetime = datetime.combine(request.desired_date, request.desired_time)
                    start_datetime = pytz.timezone('Europe/Oslo').localize(start_datetime)
                    end_datetime = start_datetime + timedelta(hours=4)  # Antatt varighet
                    
                    event_details = {
                        'room': booking_details['room'],
                        'building': request.desired_building,
                        'start_time': start_datetime,
                        'end_time': end_datetime,
                    }

                    # Legg til hendelsen i Google Kalender
                    add_event_to_google_calendar(user, event_details)
                    
                except Exception as e:
                    request.status = 'failed'
                    self.stdout.write(self.style.ERROR(f"Feil under booking: {e}"))
                    request.save()
        print("ferdig i process_bookingsappen")
