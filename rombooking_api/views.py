#rombooking_api/views.py
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from .models import BookingRequest
import json
from django.contrib.auth.decorators import login_required
import subprocess
import os
from django.conf import settings
import sys
from .models import BrukerDetaljer
from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect
from django.contrib.auth.models import User
from .decorators import user_is_approved
import time
import random
from datetime import time
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
from .models import UserCredentials
from django.utils import timezone
from .utils import check_valid_booking  # Importer funksjonen for å sjekke gyldig booking 
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from rest_framework import status
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.viewsets import ModelViewSet




os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'











from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .decorators import admin_required
from rombooking_api.models import BookingRequest
import json
from django.http import JsonResponse
from .models import Room, BookingRequest
import json
from datetime import datetime, time
import json
import random
from datetime import datetime, time
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .decorators import user_is_approved
from .models import BookingRequest, Room

@user_is_approved
@login_required
def bestill_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"Data mottatt: {data}")  # Logger dataene som mottas

            # Hent ut dataene fra forespørselen
            desired_dates = data.get('desired_dates', [])
            desired_time_str = data.get('desired_time')  # Brukerens opprinnelige ønskede tid
            desired_area = data.get('desired_area')
            desired_room_name = data.get('desired_room')
            desired_building = data.get('desired_building')
            description = data.get('description')
            instant_booking = data.get('instant_booking', False)

            # Finn rommet basert på navnet
            try:
                desired_room = Room.objects.get(name=desired_room_name)
            except Room.DoesNotExist:
                return JsonResponse(
                    {'error': f'Rom med navn "{desired_room_name}" finnes ikke.'},
                    status=400
                )

            # Sjekk at nødvendige data er tilstede
            if not desired_dates or not desired_time_str or not desired_area:
                return JsonResponse({'error': 'Mangler nødvendige data'}, status=400)

            # Konverter ønsket tid til et time-objekt
            # (dersom brukeren sender inn f.eks. "07:00")
            try:
                user_desired_time = datetime.strptime(desired_time_str, '%H:%M').time()
            except ValueError:
                return JsonResponse({'error': 'Ugyldig format på ønsket tid (forventet HH:MM).'}, status=400)

            # Hvis instant_booking er False, velg en tilfeldig tid
            if not instant_booking:
                possible_hours = [time(0, 0), time(1, 0), time(2, 0), time(6, 0), time(7, 0)]
                booking_hour = random.choice(possible_hours)

            booking_requests = []
            for single_date_str in desired_dates:
                single_date = datetime.strptime(single_date_str, '%Y-%m-%d').date()

                # Sjekk om det allerede finnes en booking på disse parametrene
                existing_booking = BookingRequest.objects.filter(
                    desired_date=single_date,
                    desired_time=user_desired_time,
                    desired_area=desired_area,
                    desired_building=desired_building,
                    desired_room=desired_room,
                    status='pending'
                ).exists()

                if existing_booking:
                    return JsonResponse({
                        "error": (
                            f"Det finnes allerede en booking for {single_date} klokken "
                            f"{user_desired_time.strftime('%H:%M')} på dette rommet."
                        )
                    }, status=400)

                # Opprett en ny booking
                booking_request = BookingRequest.objects.create(
                    user=request.user,
                    desired_date=single_date,
                    desired_time=user_desired_time,
                    desired_area=desired_area,
                    desired_room=desired_room,
                    desired_building=desired_building,
                    description=description,
                    instant_booking=instant_booking,
                    booking_hour=booking_hour if not instant_booking else time(0, 0),
                    status='pending',
                )
                booking_requests.append(booking_request)

            return JsonResponse({
                'message': f'{len(booking_requests)} bookingforespørsler opprettet for de valgte datoene',
                'booking_ids': [booking.id for booking in booking_requests]
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Ugyldig JSON-data'}, status=400)
    else:
        return JsonResponse({'message': 'Denne endepunktet aksepterer kun POST-forespørsler'}, status=405)


from django.http import JsonResponse
from datetime import datetime, timedelta
from .models import BookingRequest
from .utils import check_valid_booking

from django.http import JsonResponse
from datetime import datetime, timedelta
from .models import BookingRequest
from django.db import models


from datetime import datetime, timedelta
from django.db.models import Max
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from .models import BookingRequest  # Juster importen basert på din prosjektstruktur

@require_GET
def get_valid_dates(request):
    try:
        user = request.user
        today = datetime.now().date()

        # Definer bookingvinduet
        booking_window_start = today + timedelta(days=14)
        booking_window_end = today + timedelta(days=60)  # Juster etter behov

        # For å håndtere overlapping, hent bookinger fra (booking_window_start - 13 dager) til booking_window_end
        fetch_start_date = booking_window_start - timedelta(days=13)
        fetch_end_date = booking_window_end

        # Hent alle relevante bookinger for brukeren
        user_bookings_qs = BookingRequest.objects.filter(
            user=user,
            desired_date__gte=fetch_start_date,
            desired_date__lte=fetch_end_date,
            status__in=["confirmed", "pending"]
        ).values_list('desired_date', flat=True).order_by('desired_date')

        # Konverter til sortert liste
        booking_dates = sorted(user_bookings_qs)

        # Initialiser variabler for sliding window
        valid_dates = []
        invalid_dates = []
        booked_dates = []

        start_pointer = 0
        end_pointer = 0
        total_bookings = len(booking_dates)

        # Iterate gjennom hver dato i bookingvinduet
        current_date = booking_window_start
        while current_date <= booking_window_end:
            window_start = current_date - timedelta(days=13)
            window_end = current_date

            # Flytt start_pointer til første booking >= window_start
            while start_pointer < total_bookings and booking_dates[start_pointer] < window_start:
                start_pointer += 1

            # Flytt end_pointer til første booking > window_end
            temp_end = end_pointer  # Bruk en midlertidig pekere for å ikke påvirke den globale end_pointer
            while temp_end < total_bookings and booking_dates[temp_end] <= window_end:
                temp_end += 1

            # Antall bookinger i vinduet
            count = temp_end - start_pointer

            if count < 8:
                valid_dates.append(current_date.strftime("%Y-%m-%d"))
            else:
                invalid_dates.append(current_date.strftime("%Y-%m-%d"))

            current_date += timedelta(days=1)

        # Hent eksisterende bookinger innen bookingvinduet
        existing_bookings = BookingRequest.objects.filter(
            user=user,
            desired_date__gte=booking_window_start,
            desired_date__lte=booking_window_end,
            status__in=["confirmed", "pending"]
        ).select_related('desired_room')  # Optimaliserer databasekall hvis du bruker relasjoner

        booked_dates = [
            {
                "date": booking.desired_date.strftime("%Y-%m-%d"),
                "room": booking.desired_room.name if booking.desired_room else "Ukjent rom",
                "time": booking.desired_time.strftime("%H:%M") if booking.desired_time else "Ukjent tid",
            }
            for booking in existing_bookings
        ]

        return JsonResponse({
            "valid_dates": valid_dates,
            "invalid_dates": invalid_dates,
            "booked_dates": booked_dates,
        })

    except Exception as e:
        # Logg feilen for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Feil i get_valid_dates: {e}", exc_info=True)
        return JsonResponse({"error": "En feil oppstod på serveren."}, status=500)

from django.http import JsonResponse
from .models import BookingRequest

from django.http import JsonResponse
from .models import BookingRequest
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import BookingRequest  # Sørg for at du importerer modellen riktig
from .decorators import user_is_approved  # Importer din egen dekorator

@login_required
@user_is_approved
def get_all_bookings(request):
    # Filtrer bookingene for den innloggede brukeren
    bookings = BookingRequest.objects.filter(user=request.user).values(
        "id",
        "desired_date",
        "desired_time",
        "desired_room__name",
        "booked_room",
        "status",
        "user__username",
        "desired_area",
        "progress_delay"
    )
    
    # Formater bookingene for frontend
    formatted_bookings = [
        {
            "id": booking["id"],
            "date": booking["desired_date"].strftime("%d.%m.%Y"),  # Formatert dato
            "time": booking["desired_time"].strftime("%H:%M") if booking["desired_time"] else None,
            "room": booking["desired_room__name"],
            "booked_room": booking["booked_room"],
            "status": booking["status"],
            "user": booking["user__username"],
            "campus": booking["desired_area"],
            "progress_delay": booking["progress_delay"]
        }
        for booking in bookings
    ]
    
    return JsonResponse({"bookings": formatted_bookings})


@login_required
@user_is_approved
def get_booking(request, booking_id):
    # Hent bookingobjektet basert på ID
    booking = get_object_or_404(BookingRequest, id=booking_id)
    
    # Beregn forsinkelsen (hvis den er lagret som progress_delay)
    progress_delay = getattr(booking, 'progress_delay', None)
    
    # Returner data som JSON
    return JsonResponse({
        "id": booking.id,
        "status": booking.status,
        "progress_delay": progress_delay,  # Legg til delay-feltet
        "room": booking.booked_room,
        "campus": booking.desired_building,
        "date": booking.desired_date,
        "time": booking.desired_time.strftime('%H:%M') if booking.desired_time else None
    })

@user_is_approved
@login_required
def book_room_test(request):
    if request.method == 'POST':
        # Hent data fra forespørselen
        data = json.loads(request.body)
        desired_time = data.get('desired_time')
        desired_area = data.get('desired_area')
        desired_room = data.get('desired_room')
        desired_building = data.get('desired_building')

        try:
            # Kjør Selenium-skriptet som en underprosess
            script_path = os.path.join(settings.BASE_DIR, 'rombooking_api/management/commands/book_room.py')

            result = subprocess.run(
                [sys.executable, script_path, desired_time, desired_area, desired_room, desired_building],
                capture_output=True,
                text=True
            )

            # Sjekk om skriptet returnerte en feil
            if result.returncode != 0:
                return JsonResponse({'error': 'Feil under booking.'}, status=500)

            # Hvis vellykket, returner bekreftelsesmelding
            return JsonResponse({'message': 'Rombestilling for {} kl {} er mottatt!'.format(desired_area, desired_time), 'redirect_url': '/confirmedbooking/'}, status=200)

        except Exception as e:
            # Håndter eventuelle feil
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Kun POST-forespørsler er tillatt.'}, status=400)


from django.contrib.auth.forms import UserCreationForm



@api_view(['POST'])
def signup(request):
    """
    API-endepunkt for å registrere en ny bruker
    """
    data = request.data
    username = data.get('username')
    password = data.get('password')
    password_confirm = data.get('passwordConfirm')
    print(username, password, password_confirm)

    if not username or not password or not password_confirm:
        return Response({'error': 'Alle feltene må fylles ut.'}, status=status.HTTP_400_BAD_REQUEST)

    if password != password_confirm:
        return Response({'error': 'Passordene samsvarer ikke.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(password)  # Validerer passordet i henhold til Django's passordregler
    except ValidationError as e:
        return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, password=password)
        BrukerDetaljer.objects.create(user=user)
        return Response({'message': 'Bruker opprettet!'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': 'Kunne ikke opprette bruker. Prøv igjen.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import BookingRequest  # Antatt modell for rombookinger
@user_is_approved
@login_required
def booking_history(request):
    # Hent alle bookinger for den innloggede brukeren
    bookings = BookingRequest.objects.filter(user=request.user)

    # Send bookingene videre til template for å vise dem
    return render(request, 'booking_history.html', {'bookings': bookings})

from .models import UserCredentials  # Importer modellen for Google-legitimasjoner
from .utils import verify_feide_user  # Importer funksjonen for å verifisere Feide-brukere
def brukerdetaljer_view(request):
    if request.method == 'GET':
        try:
            # Hent brukerens detaljer
            brukerdetaljer = BrukerDetaljer.objects.get(user=request.user)
            google_connected = UserCredentials.objects.filter(user=request.user).exists()

            # Returner detaljer som JSON
            return JsonResponse({
                'username': brukerdetaljer.user.username,
                'feide_user': brukerdetaljer.feide_user,
                'google_connected': google_connected,
                'profile_approved': brukerdetaljer.profile_approved,
            })
        except BrukerDetaljer.DoesNotExist:
            return JsonResponse({'error': 'Brukerdetaljer finnes ikke.'}, status=404)

    elif request.method == 'POST':
        try:
            # Parse JSON-data fra forespørselen
            data = json.loads(request.body)
            feide_user = data.get('feide_user')
            feide_password = data.get('feide_password')

            if not feide_user or not feide_password:
                return JsonResponse({'error': 'Feide-brukernavn og passord er påkrevd.'}, status=400)

            # Verifiser Feide-brukeren
            verification_result = verify_feide_user(feide_user, feide_password)

            if not verification_result.get('success'):
                return JsonResponse({'error': 'Ugyldig brukernavn eller passord.'}, status=401)

            # Oppdater eller opprett brukerens detaljer
            brukerdetaljer, created = BrukerDetaljer.objects.get_or_create(user=request.user)
            brukerdetaljer.feide_user = feide_user
            brukerdetaljer.feide_password = feide_password
            brukerdetaljer.save()

            return JsonResponse({'message': 'Brukerdetaljer lagret!'})
        except Exception as e:
            return JsonResponse({'error': f'En feil oppstod: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Ugyldig HTTP-metode.'}, status=405)


from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

@require_http_methods(["DELETE"])
@login_required
def delete_booking(request, booking_id):
    try:
        # Hent booking med ID
        booking = get_object_or_404(BookingRequest, id=booking_id)
        
        # Slett bookingen
        booking.delete()
        
        # Returner en JSON-respons
        return JsonResponse({'message': 'Booking slettet.'}, status=200)
    
    except BookingRequest.DoesNotExist:
        return JsonResponse({'error': 'Booking ikke funnet.'}, status=404)

    except Exception as e:
        return JsonResponse({'error': f'En feil oppstod: {str(e)}'}, status=500)

# views.py
from django.core.serializers.json import DjangoJSONEncoder

from datetime import datetime, timedelta

@api_view(['POST'])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Logget inn"}, status=200)
    else:
        return Response({"error": "Ugyldig brukernavn eller passord"}, status=401)

@login_required
@user_is_approved
def dashboard(request):
    # Hent confirmed og pending bookinger fra databasen
    confirmed_bookings = BookingRequest.objects.filter(user=request.user, status__in=['confirmed', 'pending'])

    # Bygg en liste med bookingdataene
    bookings_data = []
    for booking in confirmed_bookings:
        # Kombiner desired_date og desired_time til en datetime-objekt
        start_datetime = datetime.combine(booking.desired_date, booking.desired_time)
        
        # Hvis du vil legge til 4 timer som sluttid, kan du bruke timedelta
        end_datetime = start_datetime + timedelta(hours=4)

        # Bygg bookingdataene i ønsket format
        bookings_data.append({
            'title': f'{booking.desired_area} - {booking.desired_room}',
            'start': start_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
            'end': end_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
            'color': 'green' if booking.status == 'confirmed' else 'gray'
        })

    context = {
        'bookings_json': bookings_data
    }
    return render(request, 'dashboard.html', context)




@user_is_approved
@login_required
def admin_view(request):
    if not request.user.is_superuser:  # Bare admin-brukere skal kunne se denne siden
        return redirect('login')  # Eller returner 403-forbudt

    # Finn alle brukere som ikke er godkjente (approved=False)
    unapproved_users = User.objects.filter(brukerdetaljer__profile_approved=False)

    # Finn alle brukere som har logget inn (last_login er ikke None)
    active_users = User.objects.filter(last_login__isnull=False)

    return render(request, 'administration.html', {
        'unapproved_users': unapproved_users,
        'active_users': active_users,
    })
@user_is_approved
@login_required
@admin_required
def delete_user(request, user_id):
    if not request.user.is_superuser:
        return redirect('login')

    user = get_object_or_404(User, id=user_id)

    # Slett alle bookinger relatert til brukeren
    BookingRequest.objects.filter(user=user).delete()

    # Slett BrukerDetaljer relatert til brukeren, hvis de eksisterer
    try:
        brukerdetaljer = BrukerDetaljer.objects.get(user=user)
        brukerdetaljer.delete()
    except BrukerDetaljer.DoesNotExist:
        pass  # Hvis brukeren ikke har BrukerDetaljer, fortsett videre

    # Til slutt, slett selve brukeren
    user.delete()
    
    messages.success(request, f'Brukeren {user.username} ble fjernet sammen med alle tilknyttede data.')
    return redirect('admin_view')

@admin_required
@user_is_approved
@login_required
def approve_user(request, user_id):
    if not request.user.is_superuser:
        return redirect('login')

    # Hent bruker og BrukerDetaljer-objektet
    user = get_object_or_404(User, id=user_id)
    bruker_detaljer = get_object_or_404(BrukerDetaljer, user=user)

    # Sett brukeren som godkjent
    bruker_detaljer.profile_approved = True
    bruker_detaljer.save()

    messages.success(request, f'Brukeren {user.username} er nå godkjent!')
    return redirect('admin_view')

from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import BrukerDetaljer
from django.contrib.auth.decorators import login_required
from .decorators import user_is_approved
@admin_required
@login_required
@user_is_approved
def get_unapproved_users(request):
    """
    Hent en liste over brukere som ikke er godkjente (profile_approved=False).
    """
    unapproved_users = User.objects.filter(brukerdetaljer__profile_approved=False)
    response_data = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email or "Ingen e-post",
        }
        for user in unapproved_users
    ]
    return JsonResponse(response_data, safe=False)


from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
@login_required
@login_required
def check_approval_status(request):
    """
    Sjekk om brukeren er godkjent (approved).
    """
    try:
        bruker_detaljer = request.user.brukerdetaljer
        is_approved = bruker_detaljer.profile_approved

        # Debugging-logg
        print(f"[DEBUG] Bruker: {request.user.username}, Approved: {is_approved}")

        return JsonResponse({"approved": is_approved})
    except BrukerDetaljer.DoesNotExist:
        # Debugging-logg
        print(f"[DEBUG] Bruker {request.user.username} har ingen BrukerDetaljer.")
        return JsonResponse({"approved": False})


@admin_required
@login_required
@user_is_approved
def get_active_users(request):
    """
    Hent en liste over brukere som har logget inn minst én gang (last_login er ikke None).
    """
    active_users = User.objects.filter(last_login__isnull=False)
    response_data = [
        {
            "id": user.id,
            "username": user.username,
            "last_login": user.last_login.strftime("%Y-%m-%d %H:%M:%S") if user.last_login else None,
        }
        for user in active_users
    ]
    return JsonResponse(response_data, safe=False)


CLIENT_SECRETS_FILE = os.path.join(settings.BASE_DIR, 'credentials.json')

SCOPES = ['https://www.googleapis.com/auth/calendar']
REDIRECT_URI = 'https://rombooking-ac36a5388660.herokuapp.com/api/oauth2callback/'   # Sørg for at dette samsvarer nøyaktig

def google_login(request):
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config={
            'web': {
                'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
                'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                'token_uri': 'https://oauth2.googleapis.com/token',
                'redirect_uris': [REDIRECT_URI],
                'userinfo_uri': 'https://openidconnect.googleapis.com/v1/userinfo',
                'issuer': 'https://accounts.google.com',
            }
        },
        scopes=SCOPES  # Scopes skal settes her
    )
    
    flow.redirect_uri = REDIRECT_URI

    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )

    # Logging for debugging
    print(f'Authorization URL: {authorization_url}')

    request.session['state'] = state

    return redirect(authorization_url)

from rest_framework import viewsets
from .models import Room
from .serializers import RoomSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room
from .serializers import RoomSerializer

from django.db.models import Q

class RoomList(APIView):
    def get(self, request):
        room_name = request.query_params.get('name')  # Hent "name" fra query params
        if room_name:
            # Filtrer etter eksakt navn (case-insensitivt)
            rooms = Room.objects.filter(name__iexact=room_name)
        else:
            rooms = Room.objects.all()  # Returner alle rom hvis "name" ikke er spesifisert
        
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


from rest_framework import viewsets
from .models import Room
from .serializers import RoomSerializer

class RoomViewSet(ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    def list(self, request, *args, **kwargs):
        room_name = request.query_params.get('name')  # Hent "name" fra query params
        if room_name:
            queryset = self.queryset.filter(name__iexact=room_name)
        else:
            queryset = self.queryset
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

import pytz  # Sørg for at pytz er importert
from django.shortcuts import redirect
from django.utils import timezone
import pytz
import google_auth_oauthlib.flow
from .models import UserCredentials

@login_required
@user_is_approved
def oauth2callback(request):
    state = request.session.get('state')
    if state is None:
        print('State not found in session.')
        return redirect('/settings?error=1')  # Du kan f.eks. sende brukeren til /error (React-route)

    try:
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            {
                'web': {
                    'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
                    'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                    'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
                    'token_uri': 'https://oauth2.googleapis.com/token',
                    'redirect_uris': [REDIRECT_URI],
                }
            },
            scopes=SCOPES,
            state=state
        )
        flow.redirect_uri = REDIRECT_URI

        authorization_response = request.build_absolute_uri()
        flow.fetch_token(authorization_response=authorization_response)

    except Exception as e:
        print(f"Error during token fetch: {e}")
        return redirect('/settings?error=1')

    credentials = flow.credentials
    if credentials is None:
        print('Failed to retrieve credentials.')
        return redirect('/settings?error=1')

    # Sørg for at credentials.expiry er timezone-aware
    if timezone.is_naive(credentials.expiry):
        credentials.expiry = timezone.make_aware(credentials.expiry, pytz.UTC)

    # Lagre credentials i databasen
    user = request.user
    user_credentials, created = UserCredentials.objects.get_or_create(user=user)
    user_credentials.token = credentials.token
    user_credentials.refresh_token = credentials.refresh_token
    user_credentials.token_expiry = credentials.expiry
    user_credentials.scopes = ','.join(credentials.scopes)
    user_credentials.save()

    # Returner brukeren til f.eks. /settings (en React-rute). 
    # Gjerne med en query-parameter for å indikere at alt gikk bra
    return redirect('/settings?google=connected')



# rombooking_api/views.py

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .utils import add_event_to_google_calendar
from datetime import datetime, timedelta
import pytz

# rombooking_api/views.py

from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .utils import add_event_to_google_calendar
from datetime import datetime, timedelta
import pytz
@user_is_approved
@login_required
def test_google_calendar(request):
    user = request.user  # Bruk den innloggede brukeren

    # Forbered testdata
    start_datetime = datetime.now(pytz.timezone('Europe/Oslo')) + timedelta(minutes=5)
    end_datetime = start_datetime + timedelta(hours=1)

    event_details = {
        'room': 'Test Rom 101',
        'building': 'Test Bygg',
        'start_time': start_datetime,
        'end_time': end_datetime,
    }

    # Kall funksjonen for å legge til hendelsen i Google Kalender
    result = add_event_to_google_calendar(user, event_details)

    if result:
        message = "Testhendelsen ble lagt til i din Google Kalender!"
    else:
        message = "Kunne ikke legge til testhendelsen. Sjekk konsollen for detaljer."

    return render(request, 'test_google_calendar.html', {'message': message})


from django.http import JsonResponse

@login_required
@user_is_approved
def google_disconnect(request):
    try:
        user_credentials = UserCredentials.objects.get(user=request.user)
        user_credentials.delete()
        return JsonResponse({"message": "Du har koblet fra Google Kalender."})
    except UserCredentials.DoesNotExist:
        return JsonResponse({"message": "Du har ikke koblet til Google Kalender."})


@login_required
def check_admin_status(request):
    """
    Returnerer en JSON-respons som indikerer om brukeren er en administrator.
    """
    is_admin = request.user.is_superuser
    return JsonResponse({"is_admin": is_admin})


def index(request):
    # Returner React sin index.html
    return render(request, 'index.html')



