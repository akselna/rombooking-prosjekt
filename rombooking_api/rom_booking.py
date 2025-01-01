from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
import configparser
import logging
import traceback
from datetime import datetime, timedelta
import time

# Aktiver logging
logging.basicConfig(level=logging.INFO)

# Leser brukernavn og passord fra konfigurasjonsfil
config = configparser.RawConfigParser()
config.read('.login.cfg')
user = config.get('section1', 'user')
passw = config.get('section1', 'pass')

# Konfigurer Chrome-alternativer
chrome_options = Options()
chrome_options.add_argument("--headless")  # Deaktiver headless for debugging

# Start nettleseren
driver = webdriver.Chrome(
    service=ChromeService(ChromeDriverManager().install()),
    options=chrome_options
)

try:
    # Gå til TP-rombestillingssiden
    driver.get('https://tp.educloud.no/ntnu/rombestilling/')

    # Vent på at siden lastes inn
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.TAG_NAME, 'body'))
    )

    # Sjekk om vi er på siden for valg av institusjon
    if "Søk eller velg fra listen" in driver.page_source or "Tilhørighet" in driver.page_source:
        print("Valg av institusjon nødvendig.")

        # Vent på at søkefeltet er synlig
    org_search = WebDriverWait(driver, 20).until(
        EC.visibility_of_element_located((By.ID, 'org_selector_filter'))
    )

    # Skriv inn "NTNU" i søkefeltet
    org_search.clear()
    org_search.send_keys('NTNU')
    print("Sendt 'NTNU' til søkefeltet")

    # Vent til resultatene oppdateres
    time.sleep(1)  # Juster om nødvendig

    # Vent på at NTNU-elementet er klikkbart
    try:
        ntnu_element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//li[@org_id='fc:org:ntnu.no']"))
        )
        print("Fant NTNU-elementet")
    except Exception as e:
        print(f"Kunne ikke finne NTNU-elementet: {e}")
        driver.save_screenshot('ntnu_ikke_funnet.png')
        driver.quit()
        exit()

    # Klikk på NTNU-elementet
    try:
        ntnu_element.click()
        print("Klikket på NTNU-elementet")
    except Exception as e:
        print(f"En feil oppstod under klikk på NTNU-elementet: {e}")
        driver.save_screenshot('ntnu_klikk_feil.png')
        driver.quit()
        exit()

    time.sleep(3)

    try:
        bekreft_login = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="selectorg_button"]'))
        )
        bekreft_login.click()
        print("Fant bekreft login-knapp og klikket")
    except Exception as e:
        print(f"En feil oppsto, fikk ikke bekreftet login")
        driver.quit()
        exit()






    # Nå bør vi være på Feide-innloggingssiden
    # Vent på at brukernavnfeltet lastes inn
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.ID, 'username'))
    )

    # Fyll inn brukernavn og passord
    driver.find_element(By.ID, 'username').send_keys(user)
    driver.find_element(By.ID, 'password').send_keys(passw)

    # Send inn skjemaet
    driver.find_element(By.NAME, 'f').submit()

    # Håndter eventuell samtykkeside eller ekstra trinn
    try:
        # Sjekk om det er en samtykkeside
        consent_button = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.NAME, 'accept'))
        )
        consent_button.click()
    except:
        # Ingen samtykkeside
        pass

    # Vent på at innloggingen fullføres
    WebDriverWait(driver, 20).until(
        EC.url_contains('tp.educloud.no/ntnu/rombestilling')
    )

    # Bekreft at du er logget inn ved å sjekke etter spesifikke elementer
    if "rombestilling" in driver.title.lower():
        print("Innlogging vellykket!")
    else:
        print("Innlogging mislyktes. Sjekk detaljer.")
        driver.save_screenshot('innlogging_feilet.png')

    # === Valg av område via terminalen ===

    # print("Velg område:")
    # print("1: Gløshaugen")
    # print("2: Kalvskinnet")
    # print("3: Øya")

    # område_valg = input("Skriv inn nummeret for ønsket område: ")

    # if område_valg == '1':
    #     desired_area = 'Gløshaugen'
    # elif område_valg == '2':
    #     desired_area = 'Kalvskinnet'
    # elif område_valg == '3':
    #     desired_area = 'Øya'
    # else:
    #     print("Ugyldig valg. Standardiserer til Gløshaugen.")
    desired_area = 'Gløshaugen'

    # === Automatisk rombestilling ===

    # Angi ønsket starttidspunkt og varighet
    desired_time = '10:00'        # Ønsket starttid
    desired_duration = '04:00'    # Ønsket varighet (4 timer)

    # Beregn ønsket starttidspunkt som datetime-objekt
    now = datetime.now()
    desired_time_obj = datetime.strptime(desired_time, '%H:%M').time()
    desired_datetime = datetime.combine(now.date(), desired_time_obj)

    # Legg til 14 dager
    desired_datetime += timedelta(days=14)

    # Sett booking_date til datoen for ønsket_datetime i formatet 'DD.MM.YYYY'
    booking_date = desired_datetime.strftime('%d.%m.%Y')


    print(f"Booking dato: {booking_date}")

    # Oppdater skriptet til å bruke booking_date
    date_field = driver.find_element(By.NAME, 'preset_date')
    date_field.clear()
    date_field.send_keys(booking_date)
    date_field.send_keys(Keys.RETURN)

    # Vent til siden oppdateres
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.ID, 'select2-start-container'))
    )

    # === Håndter starttidspunkt med Select2 ===

    try:
        # Klikk på Select2-kontaineren for å åpne dropdownen
        start_time_container = WebDriverWait(driver, 20).until(
            EC.element_to_be_clickable((By.ID, 'select2-start-container'))
        )
        start_time_container.click()

        # Finn søkefeltet for Select2
        start_time_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )

        # Skriv inn ønsket starttid
        start_time_search_field.send_keys(desired_time)

        # Vent litt for at resultatene skal oppdatere
        time.sleep(1)

        # Logg tilgjengelige alternativer
        options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        print("Tilgjengelige starttidsalternativer:")
        for option in options:
            print(f" - '{option.text.strip()}'")

        # Finn og klikk på ønsket alternativ
        for option in options:
            if option.text.strip() == desired_time:
                option.click()
                break
        else:
            print(f"Ønsket starttid '{desired_time}' ikke funnet blant alternativene.")
            driver.save_screenshot('starttid_alternativer_feil.png')
            driver.quit()
            exit()

    except Exception as e:
        print(f"En feil oppstod under valg av starttid: {e}")
        traceback.print_exc()
        driver.save_screenshot('starttid_feil.png')
        driver.quit()
        exit()

    # === Beregn og sett sluttid ===

    try:
        # Beregn sluttid basert på starttid og varighet
        duration_hours, duration_minutes = map(int, desired_duration.split(':'))
        duration_delta = timedelta(hours=duration_hours, minutes=duration_minutes)

        end_datetime = desired_datetime + duration_delta
        desired_end_time = end_datetime.strftime('%H:%M')

        print(f"Ønsket sluttid: {desired_end_time}")

        # Oppdater ID-en til sluttid-feltet
        end_time_container_id = 'select2-duration-container'  # Oppdater denne hvis nødvendig
        print("klarte det1")

        # Vent litt før du prøver å finne sluttid-kontaineren
        time.sleep(2)

        # Klikk på Select2-kontaineren for sluttid
        end_time_container = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.ID, end_time_container_id))
        )
        end_time_container.click()
        print("klarte det 2")

        # Finn søkefeltet for Select2
        end_time_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        print("klarted3")

        # Skriv inn ønsket sluttid
        end_time_search_field.send_keys(desired_end_time)
        print("klarted4")

        # Vent litt for at resultatene skal oppdatere
        time.sleep(1)

        # Logg tilgjengelige alternativer
        options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        print("klarted5")
        print("Tilgjengelige sluttidsalternativer:")
        for option in options:
            print("klarted6")
            print(f" - '{option.text.strip()}'")

        # Finn og klikk på ønsket alternativ
        for option in options:
                option.click()
                print("klarted7")
                break
        else:
            print(f"Ønsket sluttid '{desired_end_time}' ikke funnet blant alternativene.")
            driver.save_screenshot('sluttid_alternativer_feil.png')
            driver.quit()
            exit()

    except Exception as e:
        print(f"En feil oppstod under valg av sluttid: {e}")
        traceback.print_exc()
        driver.save_screenshot('sluttid_feil.png')
        driver.quit()
        exit()

    # === Velg område ===
# ... tidligere kode ...

# === Velg område ===

    try:
        # Klikk på Select2-kontaineren for område
        area_container = driver.find_element(By.ID, 'select2-area-container')
        area_container.click()
        print("klarted8")
        
        # Finn søkefeltet for Select2
        area_search_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'select2-search__field'))
        )
        print("klarted9")

        # Skriv inn ønsket område
        area_search_field.send_keys(desired_area)
        print("klarted10")

        # Vent litt for at resultatene skal oppdatere
        time.sleep(1)

        # Finn og klikk på ønsket område
        area_options = driver.find_elements(By.XPATH, "//li[contains(@class, 'select2-results__option')]")
        for option in area_options:
            if desired_area in option.text:
                option.click()
                print("Klikket")
                break
        else:
            print(f"Ønsket område '{desired_area}' ikke funnet.")
            driver.save_screenshot('område_feil.png')
            driver.quit()
            exit()

    except Exception as e:
        print(f"En feil oppstod under valg av område: {e}")
        traceback.print_exc()
        driver.save_screenshot('område_feil.png')
        driver.quit()
        exit()

# ... resten av skriptet ...
    # === Velg bygning ===

    # try:
    #     desired_building = 'Realfagbygget'  # Bygningen du ønsker å velge

    #     # Klikk på Select2-kontaineren for bygning
    #     building_container = driver.find_element(By.XPATH, '//*[@id="select2-building-container"]')
    #     building_container.click()
    #     print("Bygning valg startet")

    #     # Vent litt for at dropdown-menyen skal laste
    #     time.sleep(1)

    #     # Finn alle bygning-alternativene
    #     building_options = WebDriverWait(driver, 10).until(
    #         EC.presence_of_all_elements_located((By.XPATH, "//ul[@id='select2-building-results']/li"))
    #     )
    #     print("Tilgjengelige bygninger:")
    #     for option in building_options:
    #         print(f" - '{option.text.strip()}'")
    #         if desired_building == option.text.strip():
    #             option.click()
    #             print("Bygning valgt")
    #             break
    #     else:
    #         print(f"Ønsket bygning '{desired_building}' ikke funnet.")
    #         driver.save_screenshot('bygning_feil.png')
    #         driver.quit()
    #         exit()

    # except Exception as e:
    #     print(f"En feil oppstod under valg av bygning: {e}")
    #     traceback.print_exc()
    #     driver.save_screenshot('bygning_feil.png')
    #     driver.quit()
    #     exit()




    # === Klikk på "Vis ledige rom" ===

    try:
        # Finn knappen ved hjelp av ID
        vis_ledige_rom_knapp = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//*[@id="preformsubmit"]'))
        )
        vis_ledige_rom_knapp.click()
        print("Klikket på 'Vis ledige rom'")
    except Exception as e:
        print(f"En feil oppstod under klikk på 'Vis ledige rom': {e}")
        traceback.print_exc()
        driver.save_screenshot('vis_ledige_rom_feil.png')
        driver.quit()
        exit()


    # === Velg rom ===

    # Vent til romlisten er lastet
    try:
        room_list_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="room_table"]'))
        )
        print("Romlisten er lastet")
    except Exception as e:
        print(f"En feil oppstod under venting på romlisten: {e}")
        traceback.print_exc()
        driver.save_screenshot('romliste_feil.png')
        driver.quit()
        exit()

        # === Hent rommene og deres kapasiteter ===

    try:
        # Finn alle romelementer
        room_elements = driver.find_elements(By.XPATH, "//li[@class=' pad-y--xsmall']")

        rooms = []

        for room_element in room_elements:
            # Hent romnavnet
            room_name = room_element.find_element(By.CSS_SELECTOR, "label").text.strip()
            # Hent kapasiteten
            capacity_span = room_element.find_element(By.CSS_SELECTOR, "div.state.p-success > span")
            capacity_text = capacity_span.text.strip()
            capacity = int(capacity_text)
            # Hent radio-knappen for rommet
            radio_input = room_element.find_element(By.CSS_SELECTOR, "input[type='radio']")
            # Legg til i listen over rom
            rooms.append({
                'name': room_name,
                'capacity': capacity,
                'element': radio_input
            })

        print("Fant følgende rom:")
        for room in rooms:
            print(f" - {room['name']}: {room['capacity']} plasser")

    except Exception as e:
        print(f"En feil oppstod under henting av rommene: {e}")
        traceback.print_exc()
        driver.save_screenshot('henting_av_rom_feil.png')
        driver.quit()
        exit()


        # === Velg rommet med høyest kapasitet ===

    # === Velg rommet med høyest kapasitet ===

    try:
        if rooms:
            # Sorter rommene etter kapasitet i synkende rekkefølge
            rooms.sort(key=lambda x: x['capacity'], reverse=True)
            # Velg det første rommet (høyest kapasitet)
            best_room = rooms[0]
            # Klikk på radio-knappen for rommet ved hjelp av JavaScript
            driver.execute_script("arguments[0].click();", best_room['element'])
            print(f"Valgte rommet {best_room['name']} med kapasitet {best_room['capacity']}")
        else:
            print("Ingen rom tilgjengelige")
            driver.quit()
            exit()
    except Exception as e:
        print(f"En feil oppstod under valg av rom: {e}")
        traceback.print_exc()
        driver.save_screenshot('valg_av_rom_feil.png')
        driver.quit()
        exit()

# === Send inn bestillingen ===

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
        print("Klikket på 'Bestill'-knappen")
        time.sleep(2)
    except Exception as e:
        print(f"En feil oppstod under innsending av bestillingen: {e}")
        traceback.print_exc()
        driver.save_screenshot('bestilling_feil.png')
        driver.quit()
        exit()

    try:
        # Vent på at beskrivelsesfeltet er synlig
        description_field = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, '//*[@id="name"]'))
        )
        # Skriv inn "Selvstudie" i beskrivelsesfeltet
        description_field.send_keys('Selvstudie')
        time.sleep(2)
        print("Skrev inn beskrivelse")
        confirm_button = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, '//*[@id="origform"]/div[6]/section[1]/button'))
        )
        confirm_button.click()
        print("Bestilling vellykket!")
    except Exception as e:
        print(f"En feil oppsto under bestilling etter beskrivelse: {e}")
        driver.quit()
        exit()

finally:
    driver.quit()