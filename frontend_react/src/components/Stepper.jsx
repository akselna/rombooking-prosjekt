import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
} from "@mui/material";
import BookingLoader from "../components/BookingLoader";

const ResponsiveStepper = ({
  activeStep,
  setActiveStep,
  steps = [],
  handleFinish,
  selectedDates,
  selectedRoom,
  setRoomValidationError,
  description,
  setDescriptionError,
  selectedTime, // Ny prop
  setTimeValidationError, // Ny prop
  isLoading,
  success,
  error,
}) => {
  const handleNext = () => {
    if (activeStep === 0 && !selectedRoom) {
      setRoomValidationError(true);
      return;
    }
    if (activeStep === 1) {
      if (!selectedDates || selectedDates.length === 0) {
        alert("Du må velge minst én dato før du kan gå videre.");
        return;
      }

      if (!selectedTime) {
        setTimeValidationError(true); // Vis feilmelding for tid
        return;
      }
    }

    // Valider beskrivelse (Step 2)
    if (activeStep === 0 && description.trim() === "") {
      setDescriptionError(true); // Vis feilmelding
      return;
    }

    if (activeStep < steps.length - 1) {
      setRoomValidationError(false);
      setDescriptionError(false); // Fjern feilindikasjon for beskrivelse
      setTimeValidationError(false); // Fjern feilmelding for tid
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column", // Endret fra "row" til "column" for layout
          alignItems: "center", // Sentraliserer innholdet horisontalt
          mt: 4,
        }}
      >
        {/* Knappene: Tilbake + Fullfør / Prøv igjen */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 400, // Gir maks bredde for knappene
          }}
        >
          {/* Tilbake-knappen */}
          {!isLoading && !success && !error && (
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              sx={{ flex: 1, mr: 2 }}
            >
              Tilbake
            </Button>
          )}

          {activeStep === steps.length - 1 ? (
            isLoading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%", // Full bredde
                  height: "100%", // Full høyde for å sentrere i containeren
                  minHeight: 100, // Minimum høyde for å holde BookingLoader
                }}
              >
                <BookingLoader
                  isLoading={isLoading}
                  success={success}
                  error={error}
                />
              </Box>
            ) : success ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column", // Fleksboks for vertikal layout
                  justifyContent: "center", // Sentrer vertikalt
                  alignItems: "center", // Sentrer horisontalt
                  width: "100%", // Full bredde
                  height: "100%", // Full høyde
                  minHeight: 150, // Gir nok plass til teksten
                }}
              >
                <Typography
                  variant="h5"
                  color="success.main"
                  sx={{ textAlign: "center" }}
                >
                  Booking vellykket!
                </Typography>
              </Box>
            ) : (
              <Button
                onClick={handleFinish}
                variant="contained"
                color="primary"
                sx={{ flex: 1 }}
              >
                {error ? "Prøv igjen" : "Fullfør"}
              </Button>
            )
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              color="primary"
              sx={{ flex: 1 }}
            >
              Neste
            </Button>
          )}
        </Box>

        {/* Feilmeldingen */}
        {error && (
          <Typography
            variant="body2"
            color="error"
            sx={{
              mt: 2,
              textAlign: "center", // Sentrerer teksten
            }}
          >
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ResponsiveStepper;
