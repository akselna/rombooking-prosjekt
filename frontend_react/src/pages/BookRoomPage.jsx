import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Du kan fortsatt bruke dette for å hente roomId
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Autocomplete,
  TextField,
  Card,
  CardContent,
} from "@mui/material";
import Navbar from "../components/Navbar";
import ResponsiveStepper from "../components/Stepper";
import MultiDatePickerWithTime from "../components/Calendar";
import { csrfFetch } from "../csrf";
import {
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
} from "@mui/material";

const BookRoom = () => {
  const { roomId } = useParams(); // Hent rom-ID fra URL
  const [roomValidationError, setRoomValidationError] = useState(false);

  // ---- States fra koden din ----
  const [room, setRoom] = useState(null); // Data for valgt rom
  const [rooms, setRooms] = useState([]); // Alle rom
  const [filteredRooms, setFilteredRooms] = useState([]); // Filtrerte rom
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [description, setDescription] = useState(""); // Ny state for beskrivelse
  const [instantBooking, setInstantBooking] = useState(false); // Ny state for instant booking
  const [descriptionError, setDescriptionError] = useState(false); // Validering for beskrivelse
  const [timeValidationError, setTimeValidationError] = useState(false); // Legg til denne linjen
  const [userDetails, setUserDetails] = useState(null);
  const [profileValid, setProfileValid] = useState(false);
  const [userError, setUserError] = useState("");
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  // ---- Her er stegene du ønsker i stepperen ----
  const steps = ["Velg et rom", "Velg dato", "Fullfør booking"];
  // Ikke nødvendig med routes lenger, så du kan fjerne (eller kommentere ut) routes:
  // const routes = ["/choose-room", "/confirm-details", "/complete-booking"];

  // ---- Legg til en state for å holde styr på hvilket steg vi er på ----
  const [activeStep, setActiveStep] = useState(0);

  // -----------------------------------------------------
  // Hent alle rom når siden lastes
  // -----------------------------------------------------
  useEffect(() => {
    const fetchAllRooms = async () => {
      try {
        const response = await axios.get("/api/rooms/");
        setRooms(response.data);
      } catch (error) {
        console.error("Feil ved henting av romdata:", error);
      }
    };
    fetchAllRooms();
  }, []);

  // -----------------------------------------------------
  // Hent brukerdetaljer når komponenten laster
  // -----------------------------------------------------
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get("/api/brukerdetaljer/");
        setUserDetails(response.data);
        setProfileValid(!!response.data.feide_user); // Sjekk om feide_user er satt
      } catch (error) {
        console.error("Feil ved henting av brukerdetaljer:", error);
        setUserError("Kunne ikke hente brukerdetaljer.");
      } finally {
        setIsFetchingUser(false);
      }
    };
    fetchUserDetails();
  }, []);

  const handleFinish = async () => {
    // Sjekk om brukeren har satt et Feide-brukernavn
    if (!profileValid) {
      setUserError(
        "Du må koble til en Feide-bruker før du kan gjøre bookinger"
      );
      return;
    }

    // Valider beskrivelse
    if (!description.trim()) {
      setDescriptionError(true);
      return;
    } else {
      setDescriptionError(false);
    }

    // Valider romvalg
    if (!selectedRoom) {
      setRoomValidationError(true);
      return;
    } else {
      setRoomValidationError(false);
    }

    // Valider tid
    if (!selectedTime) {
      setTimeValidationError(true);
      return;
    } else {
      setTimeValidationError(false);
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    const timer = new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const payload = {
        desired_dates: selectedDates.map((date) => date.format("YYYY-MM-DD")),
        desired_time: selectedTime ? selectedTime.format("HH:mm") : null,
        desired_area: selectedArea,
        desired_room: selectedRoom,
        desired_building: selectedBuilding,
        description: description, // Korrigert til kun å bruke beskrivelse fra state
        instant_booking: instantBooking, // Legg til instant booking flagg
      };

      const [response] = await Promise.all([
        csrfFetch("/api/book-room/", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
        timer,
      ]);

      if (response.ok) {
        setSuccess(true);
        // Eventuelt: Gå til neste steg eller tilbakestill form
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Noe gikk galt.");
      }
    } catch (err) {
      setError("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------
  // Filtrer rom basert på valgt område og bygg
  // -----------------------------------------------------
  useEffect(() => {
    const filtered = rooms.filter((r) => {
      const matchesArea = selectedArea ? r.campus === selectedArea : true;
      const matchesBuilding = selectedBuilding
        ? r.building === selectedBuilding
        : true;
      return matchesArea && matchesBuilding;
    });
    setFilteredRooms(filtered);
  }, [selectedArea, selectedBuilding, rooms]);

  // -----------------------------------------------------
  // Hent romdetaljer hvis vi har en roomId (fra URL)
  // -----------------------------------------------------
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (roomId) {
        try {
          const response = await axios.get(
            `/api/rooms/?name=${encodeURIComponent(roomId)}`
          );
          if (response.data.length > 0) {
            const roomData = response.data[0];
            setRoom(roomData);
            setSelectedArea(roomData.campus);
            setSelectedBuilding(roomData.building);
            setSelectedRoom(roomData.name);
          } else {
            console.error("Ingen rom funnet for det gitte navnet.");
          }
        } catch (error) {
          console.error("Feil ved henting av romdetaljer:", error);
        }
      }
    };
    fetchRoomDetails();
  }, [roomId]);

  useEffect(() => {
    if (selectedRoom) {
      const roomData = rooms.find((room) => room.name === selectedRoom);
      if (roomData) {
        setSelectedArea(roomData.campus); // Sett område
        setSelectedBuilding(roomData.building); // Sett bygg
      }
    }
  }, [selectedRoom, rooms]);

  // -----------------------------------------------------
  // Eksempel på hvordan du kan vise forskjellig innhold
  // basert på hvilket steg som er aktivt
  // -----------------------------------------------------
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            {/* STEP 0 - Velg Rom */}
            <Box sx={{ textAlign: "center", marginBottom: 4 }}>
              {room ? (
                <>
                  <img
                    src={room.image_url}
                    alt={room.name}
                    style={{
                      width: "100%",
                      maxWidth: 400,
                      height: "auto",
                      margin: "0 auto 16px auto",
                      borderRadius: 8,
                    }}
                  />
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {room.name}
                  </Typography>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    Kapasitet: {room.capacity}
                  </Typography>
                </>
              ) : (
                <Typography variant="h6">
                  Velg et rom for å se detaljer
                </Typography>
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Velg område */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  disablePortal
                  options={[...new Set(rooms.map((r) => r.campus))]}
                  value={selectedArea}
                  onChange={(event, newValue) => {
                    setSelectedArea(newValue);
                    setSelectedBuilding("");
                    setSelectedRoom("");
                  }}
                  getOptionLabel={(option) => option || ""}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Velg område"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Velg bygg */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  disablePortal
                  options={[
                    ...new Set(
                      rooms
                        .filter((r) => r.campus === selectedArea)
                        .map((r) => r.building)
                    ),
                  ]}
                  value={selectedBuilding}
                  onChange={(event, newValue) => {
                    setSelectedBuilding(newValue);
                    setSelectedRoom("");
                  }}
                  getOptionLabel={(option) => option || ""}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Velg bygg"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Velg rom */}
              <Grid item xs={12}>
                <Autocomplete
                  disablePortal
                  options={filteredRooms}
                  getOptionLabel={(option) => option?.name || ""}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <span style={{ marginRight: "8px" }}>{option.name}</span>
                      <span style={{ color: "gray", fontSize: "0.85em" }}>
                        ({option.capacity} plasser)
                      </span>
                    </li>
                  )}
                  value={
                    filteredRooms.find((r) => r.name === selectedRoom) || null
                  }
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setSelectedRoom(newValue.name); // lagre navnet i selectedRoom
                      setRoom(newValue); // sett hele rom-objektet
                      setRoomValidationError(false); // Fjern feilmelding hvis valgt
                    } else {
                      setSelectedRoom("");
                      setRoom(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Velg rom"
                      variant="outlined"
                      fullWidth
                      error={roomValidationError} // Gjør boksen rød ved feil
                      helperText={
                        roomValidationError
                          ? "Du må velge et gyldig rom før du kan gå videre."
                          : ""
                      } // Feilmeldingstekst
                    />
                  )}
                />
                {/* Beskrivelse */}
                <Grid item xs={12} marginTop={2}>
                  <TextField
                    label="Beskrivelse"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    error={descriptionError} // Gjør boksen rød ved feil
                    helperText={
                      descriptionError
                        ? "Du må velge en beskrivelse før du kan gå videre."
                        : ""
                    } // Feilmeldingstekst
                  />
                </Grid>

                {/* Instant Booking */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={instantBooking}
                        onChange={(e) => setInstantBooking(e.target.checked)}
                      />
                    }
                    label="Ønsker instant booking"
                  />
                </Grid>
              </Grid>
            </Grid>
          </>
        );

      case 1:
        return (
          <MultiDatePickerWithTime
            selectedDates={selectedDates}
            setSelectedDates={setSelectedDates}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            timeValidationError={timeValidationError} // Passer valideringsfeil
            setTimeValidationError={setTimeValidationError} // Passer setter for feil
          />
        );

      case 2:
        return (
          <>
            {/* STEP 2 - Fullfør booking */}
            <Typography
              variant="h5"
              sx={{ marginBottom: 2, textAlign: "center" }}
            >
              Oppsummering av booking
            </Typography>

            {/* Oppsummering av valgt rom */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                backgroundColor: "background.paper",
                borderRadius: 2,
                padding: 2,
                marginBottom: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Valgt rom
              </Typography>
              {room ? (
                <>
                  <Typography variant="body1">Romnavn: {room.name}</Typography>
                  <Typography variant="body1">
                    Kapasitet: {room.capacity}
                  </Typography>
                  <Typography variant="body1">Område: {room.campus}</Typography>
                  <Typography variant="body1">Bygg: {room.building}</Typography>
                </>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Ingen rom valgt
                </Typography>
              )}
            </Box>

            {/* Oppsummering av valgte datoer */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                backgroundColor: "background.paper",
                borderRadius: 2,
                padding: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Valgte datoer og tid
              </Typography>
              {selectedDates.length > 0 ? (
                selectedDates.map((date, index) => (
                  <Typography key={index} variant="body1">
                    {date.format("DD-MM-YYYY")},{" "}
                    {selectedTime.format("HH:mm") +
                      " - " +
                      selectedTime.add(4, "hour").format("HH:mm")}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Ingen datoer valgt
                </Typography>
              )}
            </Box>
          </>
        );

      default:
        return <div>Ukjent steg</div>;
    }
  };

  // Hvis vi fortsatt henter brukerdetaljer, vis en loader
  if (isFetchingUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Card
          sx={{
            width: "100%",
            maxWidth: 800,
            padding: 4,
            borderRadius: 3,
            margin: "0 auto",
          }}
        >
          <CardContent>
            {/* Viser brukerfeil hvis det finnes */}

            {/* Her rendres innholdet for hvert steg */}
            {renderStepContent(activeStep)}

            {/* Stepperen nederst */}
            <Box sx={{ marginTop: 4, textAlign: "center" }}>
              <ResponsiveStepper
                steps={steps}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                selectedRoom={selectedRoom}
                selectedDates={selectedDates}
                selectedTime={selectedTime} // Passer valgt tid
                setRoomValidationError={setRoomValidationError}
                description={description}
                setDescriptionError={setDescriptionError}
                setTimeValidationError={setTimeValidationError} // Passer setter for feil
                handleFinish={handleFinish}
                isLoading={isLoading}
                success={success}
                error={error}
              />
            </Box>
          </CardContent>
          {userError && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {userError}
            </Alert>
          )}
        </Card>
      </Box>
    </div>
  );
};

export default BookRoom;
