import React, { useEffect, useState } from "react";
import { StaticDatePicker, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Typography, TextField, Container } from "@mui/material";
import axios from "axios";

export default function MultiDatePickerWithTime({
  selectedDates,
  setSelectedDates,
  selectedTime,
  setSelectedTime,
}) {
  const [invalidDates, setInvalidDates] = useState([]); // Ny state for ugyldige datoer
  const today = dayjs(); // Dagens dato
  const cutoffDate = today.add(14, "day"); // 14 dager frem i tid

  // Hent ugyldige datoer fra API
  useEffect(() => {
    const fetchInvalidDates = async () => {
      try {
        const response = await axios.get("/api/get-valid-dates/");
        setInvalidDates(response.data.invalid_dates.map((date) => dayjs(date)));
      } catch (error) {
        console.error("Feil ved henting av ugyldige datoer:", error);
      }
    };
    fetchInvalidDates();
  }, []);

  const handleDaySelect = (date) => {
    // Ikke tillat valg av ugyldige eller cutoff-datoer
    if (
      invalidDates.some((d) => d.isSame(date, "day")) ||
      date.isBefore(cutoffDate, "day")
    ) {
      return;
    }

    const isAlreadySelected = selectedDates.some((d) => d.isSame(date, "day"));
    if (isAlreadySelected) {
      setSelectedDates((prevDates) =>
        prevDates.filter((d) => !d.isSame(date, "day"))
      );
    } else {
      setSelectedDates((prevDates) => [...prevDates, date]);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: 2,
          maxWidth: "400px",
          margin: "auto",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            fontSize: { xs: "1.4rem", sm: "1.8rem" },
          }}
        >
          Velg datoer og klokkeslett
        </Typography>

        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={null}
          onChange={() => {}}
          renderInput={() => null}
          renderDay={(date, _, pickersDayProps) => {
            const isSelected = selectedDates.some((d) => d.isSame(date, "day"));
            const isInvalid =
              invalidDates.some((d) => d.isSame(date, "day")) ||
              date.isBefore(cutoffDate, "day");

            return (
              <PickersDay
                {...pickersDayProps}
                disabled={isInvalid} // Deaktiver ugyldige og cutoff-datoer
                selected={isSelected}
                onClick={() => !isInvalid && handleDaySelect(date)} // Tillat kun klikk på gyldige datoer
                sx={{
                  backgroundColor: isSelected
                    ? "rgba(0, 123, 255, 0.3)"
                    : undefined,
                  "&:hover": {
                    backgroundColor: isSelected
                      ? "rgba(0, 123, 255, 0.5)"
                      : undefined,
                  },
                  border: isSelected
                    ? "1px solid rgba(0, 123, 255, 0.8)"
                    : undefined,
                }}
              />
            );
          }}
        />

        <TextField
          label="Velg tid"
          type="time"
          value={selectedTime ? selectedTime.format("HH:mm") : ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value) {
              const [hours, minutes] = value.split(":");
              setSelectedTime(dayjs().hour(hours).minute(minutes));
            } else {
              setSelectedTime(null);
            }
          }}
          inputProps={{
            step: 300, // 5-minutters intervaller
          }}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            "& .MuiInputBase-input": {
              textAlign: "center",
            },
          }}
        />
      </Container>
    </LocalizationProvider>
  );
}
