from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options
from django.conf import settings
import traceback
from datetime import datetime, timedelta
import time
import os
from dotenv import load_dotenv
import difflib
import chromedriver_autoinstaller
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
    print("før org_search")
    org_search = WebDriverWait(driver, 20).until(
        EC.visibility_of_element_located((By.ID, 'org_selector_filter'))
    )
    print("etter org_search")
    time.sleep(2)
    org_search.clear()
    time.sleep(2)
    org_search.send_keys('NTNU')

    time.sleep(1)

    try:
        print("prøver å finne ntnu")
        ntnu_element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//li[@org_id='fc:org:ntnu.no']"))
        )
        print("ntnu er klikkbar")
    except Exception as e:
        print(f"Kunne ikke finne NTNU-elementet: {e}")
        raise

    try:
        ntnu_element.click()
        print("klikket på ntnu")
    except Exception as e:
        print(f"En feil oppstod under klikk på NTNU-elementet: {e}")
        raise

    time.sleep(3)

    try:
        bekreft_login = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="selectorg_button"]'))
        )
        bekreft_login.click()
        print("klikket bekreft login")
    except Exception as e:
        print(f"En feil oppsto, fikk ikke bekreftet login")
        raise

def login(driver, user_credentials):
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, 'username'))
        )
        driver.find_element(By.ID, 'username').send_keys(user_credentials['feide_user'])
        driver.find_element(By.ID, 'password').send_keys(user_credentials['feide_password'])
        driver.find_element(By.NAME, 'f').submit()

        try:
            consent_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.NAME, 'accept'))
            )
            consent_button.click()
        except:
            pass

        time.sleep(5)

        WebDriverWait(driver, 20).until(
            EC.url_contains('tp.educloud.no/ntnu/rombestilling')
        )
    except Exception as e:
        print(f"Feil under innlogging: {e}")
        raise


def set_date_and_time(driver, desired_time):
    # Sjekk om desired_time er en streng eller et time-objekt
    if isinstance(desired_time, str):
        # Konverterer 'desired_time' (input som '%H:%M') til et time-objekt
        desired_time_obj = datetime.strptime(desired_time, '%H:%M').time()
    else:
        # Hvis det allerede er et time-objekt, bruk det som det er
        desired_time_obj = desired_time
    
    # Beregn datoen 14 dager frem i tid
    now = datetime.now()
    booking_date = (now + timedelta(days=14)).date()
    
    # Kombiner bookingdato med ønsket starttidspunkt
    desired_datetime = datetime.combine(booking_date, desired_time_obj)
    
    # Beregn sluttiden (1 time og 30 minutter etter starttidspunkt)
    end_time = desired_datetime + timedelta(hours=4)
    
    # Formater datoen for å bruke den i formfeltet
    booking_date_str = booking_date.strftime('%d.%m.%Y')
    
    # Fyll inn bookingdato i det tilsvarende feltet
    date_field = driver.find_element(By.NAME, 'preset_date')
    date_field.clear()
    date_field.send_keys(booking_date_str)
    date_field.send_keys(Keys.RETURN)

    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.ID, 'select2-start-container'))
    )

    start_time_str = desired_time_obj.strftime('%H:%M')

    try:
        start_time_container = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.ID, 'select2-start-container'))
        )
        start_time_container.click()

        start_time_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        start_time_search_field.send_keys(start_time_str)

        time.sleep(1)

        options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        for option in options:
            if option.text.strip() == start_time_str:
                option.click()
                break
        else:
            print(f"Ønsket starttid '{start_time_str}' ikke funnet blant alternativene.")
            raise ValueError("Valgt starttid er utenfor tidsperiode: (06.00-00.00)")

    except Exception as e:
        print(f"En feil oppstod under valg av starttid: {e}")
        traceback.print_exc()
        raise

    end_time_str = end_time.strftime('%H:%M')


    try:
        end_time_container = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.ID, 'select2-duration-container'))
        )
        end_time_container.click()

        end_time_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        end_time_search_field.send_keys(end_time_str)

        time.sleep(1)

        options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        for option in options:
            option.click()
            break
        else:
            print(f"Ønsket sluttid '{end_time_str}' ikke funnet blant alternativene.")
            raise ValueError("Slutttid (Starttid + 1,5 timer) er ikke innenfor romtidene (06.00-00.00)")

    except Exception as e:
        print(f"En feil oppstod under valg av sluttid: {e}")
        traceback.print_exc()
        raise

def select_area(driver, desired_area):
    try:
        area_container = driver.find_element(By.ID, 'select2-area-container')
        area_container.click()

        area_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        area_search_field.send_keys(desired_area)

        time.sleep(1)

        area_options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        for option in area_options:
            if desired_area in option.text:
                option.click()
                break
        else:
            print(f"Ønsket område '{desired_area}' ikke funnet.")
            raise ValueError("Feil oppsto under valg av område")

    except Exception as e:
        print(f"En feil oppstod under valg av område: {e}")
        traceback.print_exc()
        raise


def select_building(driver, desired_building):
    try:
        # Finn containeren for bygning
        building_container = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'select2-building-container'))
        )
        building_container.click()

        # Finn søkefeltet for bygning
        building_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        building_search_field.send_keys(desired_building)

        time.sleep(1)

        # Finn og klikk på ønsket bygning
        building_options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        for option in building_options:
            if desired_building in option.text:
                option.click()
                break
        else:
            print(f"Ønsket bygning '{desired_building}' ikke funnet.")
            raise ValueError(f"Feil under valg av bygning: {desired_building}")
    except Exception as e:
        print(f"En feil oppstod under valg av bygning: {e}")
        traceback.print_exc()
        raise

def show_available_rooms(driver):
    try:
        vis_ledige_rom_knapp = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="preformsubmit"]'))
        )
        vis_ledige_rom_knapp.click()
    except Exception as e:
        print(f"En feil oppstod under klikk på 'Vis ledige rom': {e}")
        traceback.print_exc()
        raise


def select_room_by_name(driver, request_id):
    # Hent romnavnet fra Room-objektet. F.eks. "G321"
    desired_room_name = request_id.desired_room.name.lower().strip()

    try:
        print("Searching for the specified room...")

        # Wait until the room list is loaded
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//label[@for]"))
        )

        # Finn alle labels med en 'for'-attributt
        labels = driver.find_elements(By.XPATH, "//label[@for]")

        # Først: forsøk å finne rommet eksakt
        for label in labels:
            full_room_name = label.text.strip()
            radio_button_id = label.get_attribute('for')
            if not radio_button_id:
                continue

            # Del opp for å hente ut romkoden (hvis formatet er "Romnavn: G321")
            room_name_parts = full_room_name.split(':')
            if len(room_name_parts) > 1:
                room_code = room_name_parts[1].strip().lower()
            else:
                room_code = full_room_name.lower()

            # Sjekk om det matcher rommet vi ønsker
            if desired_room_name == room_code:
                radio_button = driver.find_element(By.ID, radio_button_id)
                driver.execute_script("arguments[0].scrollIntoView(true);", radio_button)
                radio_button.click()
                print(f"Room '{full_room_name}' selected.")
                return full_room_name  # Return the full room name
        else:
            # Fant ingen eksakt match
            raise Exception("Exact room not found")

    except Exception as e:
        print(f"Could not find the exact room '{desired_room_name}': {e}")
        traceback.print_exc()

        # Fallback: Prøv å finne et rom med liknende navn
        try:
            print("Attempting to find a room with a similar name...")

            # Vent til rom-labels er lastet
            WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.XPATH, "//label[@for]"))
            )

            labels = driver.find_elements(By.XPATH, "//label[@for]")

            room_options = []

            for label in labels:
                full_room_name = label.text.strip()
                radio_button_id = label.get_attribute('for')
                if not radio_button_id:
                    continue

                # Del opp for å hente romkoden
                room_name_parts = full_room_name.split(':')
                if len(room_name_parts) > 1:
                    room_code = room_name_parts[1].strip().lower()
                else:
                    room_code = full_room_name.lower()

                radio_button = driver.find_element(By.ID, radio_button_id)
                room_options.append((radio_button, room_code, full_room_name))

            if not room_options:
                print("No rooms available to select.")
                raise ValueError("No rooms available.")

            # Beregn likhetsscore
            similarity_scores = []
            for radio_button, room_code, full_room_name in room_options:
                ratio_code = difflib.SequenceMatcher(None, desired_room_name, room_code).ratio()
                ratio_full = difflib.SequenceMatcher(None, desired_room_name, full_room_name.lower()).ratio()
                best_ratio = max(ratio_code, ratio_full)
                similarity_scores.append((best_ratio, radio_button, full_room_name))

                print(f"Comparing '{desired_room_name}' with code '{room_code}': score {ratio_code:.2f}")
                print(f"Comparing '{desired_room_name}' with full name '{full_room_name.lower()}': score {ratio_full:.2f}")

            # Sorter etter best ratio
            similarity_scores.sort(reverse=True, key=lambda x: x[0])

            if similarity_scores:
                best_match_ratio, best_radio_button, best_room_name = similarity_scores[0]
                print(f"Selected room '{best_room_name}' with similarity score {best_match_ratio:.2f}")
                driver.execute_script("arguments[0].scrollIntoView(true);", best_radio_button)
                best_radio_button.click()
                return best_room_name
            else:
                print("No rooms available to select.")
                raise ValueError("No rooms available.")

        except Exception as fallback_error:
            print(f"An error occurred when trying to find a similar room: {fallback_error}")
            traceback.print_exc()
            raise




def get_room_name(driver):
    try:
        room_info_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[@id='origform']/div[1]/section/div[2]/span/div[3]"))
        )
        room_name = room_info_element.text.split('\n')[1].strip()
        return room_name
    except Exception as e:
        print(f"Error while extracting room name: {e}")
        return None


def submit_booking(driver, booking_request):
    try:
        # Vent litt for at "Bestill"-knappen skal bli synlig etter at rommet er valgt
        time.sleep(1)

        # Vent til "Bestill"-knappen er synlig og klikkbar
        bestill_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'rb-bestill'))
        )
        # Scrolle til knappen i tilfelle den ikke er i visningsområdet
        driver.execute_script("arguments[0].scrollIntoView(true);", bestill_button)
        # Klikk på knappen
        bestill_button.click()
        time.sleep(2)
        
        # Legg inn beskrivelse
        description_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, '//*[@id="name"]'))
        )
        description_field.send_keys(booking_request.description)

        confirm_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="origform"]/div[6]/section[1]/button'))
        )
        confirm_button.click()

        time.sleep(2)

        print("Bestilling vellykket!")

        # Finn romnavnet etter bekreftelse
        try:
            room_name = get_room_name(driver)
            print(f"Romnavn: {room_name}")
            return room_name

        except Exception as e:
            print(f"Kunne ikke finne romnavnet: {e}")

    except Exception as e:
        print(f"En feil oppstod under innsending av bestillingen: {e}")
        traceback.print_exc()
        booking_request.status = 'failed'
        booking_request.progress = 'Bestilling mislyktes'
        booking_request.save()






def book_room_test(request_id):
    print("Starter testing av booking...")
    try:
        driver = setup_driver()
        print("Driver opprettet")
        
        driver.get('https://tp.educloud.no/ntnu/rombestilling/')
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
        print("Navigerte til TP-rombestilling")

        select_institution(driver)
        print("Institusjon valgt")

        # Eksempelbrukerdata for testing
        decrypted_password = request_id.user.brukerdetaljer.feide_password
        user_credentials = {
            "feide_user": request_id.user.brukerdetaljer.feide_user,
            "feide_password": decrypted_password,
        }

        login(driver, user_credentials)
        print("Innlogging fullført")

        set_date_and_time(driver, request_id.desired_time)
        desired_time = request_id.desired_time
        current_date = datetime.now().date()  # Bruk dagens dato
        desired_datetime = datetime.combine(current_date, desired_time)
        end_time = desired_datetime + timedelta(hours=4)
        print(f"Valgt starttid: {request_id.desired_time} og sluttid: {end_time}")

        if request_id.desired_area is not None:
            select_area(driver, request_id.desired_area)  # Velg område Gløshaugen
            print(f"Område {request_id.desired_area} valgt")

        if request_id.desired_building is not None:
            select_building(driver, request_id.desired_building)
            print(f"Bygning {request_id.desired_building} valgt")

        show_available_rooms(driver)  # Vis ledige rom etter valg av område
        print("Viste ledige rom")

        if request_id.desired_room is not None:
            select_room_by_name(driver, request_id)  # Velg rommet med gitt verdi

        chosen_room = submit_booking(driver, request_id)  # Send inn bestillingen

        print("Bestillingen er sendt inn")
        
        driver.quit()
        return {
            'room': chosen_room,
            'start_time': desired_time,
            'end_time': end_time,
            'date': desired_datetime.date().strftime('%d.%m.%Y'),

        }

    except Exception as e:
        print(f"Test feilet: {e}")
        raise
