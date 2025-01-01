from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from django.conf import settings
from .models import UserCredentials
from .models import BookingRequest
import pytz
from datetime import datetime, timedelta

def add_event_to_google_calendar(user, booking_details):
    try:
        # Hent brukerens lagrede legitimasjon
        user_credentials = UserCredentials.objects.get(user=user)
        
        # Rekonstruer credentials
        credentials = Credentials(
            token=user_credentials.token,
            refresh_token=user_credentials.refresh_token,
            token_uri=settings.GOOGLE_OAUTH2_TOKEN_URI,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            scopes=user_credentials.scopes.split(','),
        )
        
        # Forny token hvis det er utløpt
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            # Oppdater tokens i databasen
            user_credentials.token = credentials.token
            user_credentials.token_expiry = credentials.expiry
            user_credentials.save()
        
        # Opprett en kalender API-klient
        service = build('calendar', 'v3', credentials=credentials)

        # Sjekk om kalenderen "Rombooking" eksisterer
        calendar_list = service.calendarList().list().execute()
        rombooking_calendar_id = None
        
        for calendar_entry in calendar_list['items']:
            if calendar_entry['summary'] == 'Rombooking':
                rombooking_calendar_id = calendar_entry['id']
                break

        # Hvis kalenderen ikke finnes, opprett en ny
        if not rombooking_calendar_id:
            new_calendar = {
                'summary': 'Rombooking',
                'timeZone': 'Europe/Oslo'
            }
            created_calendar = service.calendars().insert(body=new_calendar).execute()
            rombooking_calendar_id = created_calendar['id']

        # Konstruer hendelsen
        event = {
            'summary': f"Rombooking: {user} | {booking_details['room']}",
            'location': f"{booking_details['building']}",
            'description': 'Rombestilling via rombooking-app',
            'start': {
                'dateTime': booking_details['start_time'].isoformat(),
                'timeZone': 'Europe/Oslo',
            },
            'end': {
                'dateTime': booking_details['end_time'].isoformat(),
                'timeZone': 'Europe/Oslo',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 20},
                ],
            },
        }
        
        # Legg til hendelsen i "Rombooking"-kalenderen
        event_result = service.events().insert(calendarId=rombooking_calendar_id, body=event).execute()
        
        return event_result
    
    except UserCredentials.DoesNotExist:
        # Brukeren har ikke koblet sin Google-konto
        print(f"Bruker {user.username} har ikke koblet Google-kontoen sin.")
        return None
    except Exception as e:
        print(f"Feil under opprettelse av kalenderhendelse: {e}")
        return None
    

def check_valid_booking(date, user):
    if isinstance(date, str):
        date = datetime.strptime(date, "%Y-%m-%d").date()
    bookings_in_period_back = BookingRequest.objects.filter(
        user=user,
        desired_date__lte=date,
        desired_date__gte=date - timedelta(days=14),
        status__in = ['confirmed', 'pending'])
    if bookings_in_period_back.count() > 7:
        return False, bookings_in_period_back.first().desired_date, date
    return True, None, None


from datetime import datetime, timedelta
from django.db.models import Q

def check_valid_booking2(dates, user):
    """
    Sjekk om en booking er gyldig basert på 14-dagers-regelen.
    
    Args:
        dates (list[str] | list[datetime.date]): Liste over datoer som forespørres.
        user (User): Brukeren som gjør forespørselen.

    Returns:
        bool, str: True hvis gyldig, ellers False med årsaksmelding.
    """
    # Konverter datoer hvis de er i strengformat
    if isinstance(dates[0], str):
        dates = [datetime.strptime(date, "%Y-%m-%d").date() for date in dates]
    
    for date in dates:
        # Definer 14-dagers vindu rundt den gjeldende datoen
        start_date = date - timedelta(days=14)
        end_date = date + timedelta(days=14)
        
        # Finn bookinger i 14-dagers perioden for brukeren
        bookings_in_period = BookingRequest.objects.filter(
            user=user,
            desired_date__range=(start_date, end_date),
            status__in=['confirmed', 'pending']
        )
        
        # Sjekk om antall bookinger i perioden overskrider grensen
        if bookings_in_period.count() >= 8:
            return False, f"Booking på {date} bryter maksgrensen på 8 bookinger i 14-dagersperioden."
    
    # Hvis ingen datoer bryter regelen
    return True, "Booking er gyldig."


from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from django.conf import settings
import time
import traceback
import chromedriver_autoinstaller
from dotenv import load_dotenv

load_dotenv()

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')

    chromedriver_autoinstaller.install()
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def select_institution(driver):
    try:
        org_search = WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.ID, 'org_selector_filter'))
        )
        org_search.clear()
        org_search.send_keys('NTNU')

        ntnu_element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//li[@org_id='fc:org:ntnu.no']"))
        )
        ntnu_element.click()

        bekreft_login = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="selectorg_button"]'))
        )
        bekreft_login.click()

    except Exception as e:
        print(f"Error selecting institution: {e}")
        raise

def verify_feide_user(feide_user, feide_password):
    print("Starter Feide-brukerverifisering...")

    try:
        driver = setup_driver()
        print("Driver opprettet")

        driver.get('https://tp.educloud.no/ntnu/rombestilling/')
        time.sleep(1)  # Kort pause etter åpning av siden
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        print("Navigerte til TP-rombestilling")

        time.sleep(1)  # Pause før valg av institusjon
        select_institution(driver)
        print("Institusjon valgt")

        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.ID, 'username'))
            )
            driver.find_element(By.ID, 'username').send_keys(feide_user)
            time.sleep(1)  # Pause etter å skrive brukernavn
            driver.find_element(By.ID, 'password').send_keys(feide_password)
            driver.find_element(By.NAME, 'f').submit()
            time.sleep(1)  # Pause etter å sende inn skjemaet

            # Sjekk etter samtykke-knapp
            try:
                consent_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.NAME, 'accept'))
                )
                consent_button.click()
            except:
                pass

            # Sjekk om vi blir navigert til riktig side
            WebDriverWait(driver, 10).until(
                EC.url_contains('tp.educloud.no/ntnu/rombestilling')
            )
            print("Bruker logget inn med suksess")
            return {"success": True, "message": "Innlogging vellykket"}

        except Exception as e:
            print(f"Feil under innlogging: {e}")
            return {"success": False, "message": "Ugyldig brukernavn eller passord"}

    except Exception as e:
        print(f"Feil under verifisering: {e}")
        return {"success": False, "message": "En feil oppstod under verifiseringen"}

    finally:
        driver.quit()
        print("Driver lukket")






    
    


