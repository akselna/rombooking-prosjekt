import React, { useEffect, useState, useMemo, useCallback } from "react";
import { StaticDatePicker, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Typography,
  TextField,
  Container,
  Tooltip,
  Box,
  useMediaQuery,
} from "@mui/material";
import { csrfFetch } from "../csrf"; // Sørg for at denne importen er korrekt

// Funksjon for å erstatte isSameOrBefore
const isSameOrBefore = (date1, date2, unit) => {
  return date1.isSame(date2, unit) || date1.isBefore(date2, unit);
};

// Funksjon for å justere selectedDates for å overholde bookingbegrensningen
const adjustSelectedDates = (dates) => {
  const sorted = [...dates].sort((a, b) => a.diff(b));
  const adjusted = [];
  let windowStart = 0;

  for (let i = 0; i < sorted.length; i++) {
    // Flytt windowStart til første dato innenfor 14-dagers vinduet
    while (sorted[i].diff(sorted[windowStart], "day") > 13) {
      windowStart++;
    }

    // Antall bookinger innenfor vinduet
    const bookingsInWindow = i - windowStart + 1;

    if (bookingsInWindow <= 8) {
      adjusted.push(sorted[i]);
    }
    // Hvis antall bookinger i vinduet > 8, hopper vi over å legge til denne datoen
    // Dette vil automatisk fjerne eldre datoer som fører til overskridelse
  }

  return adjusted;
};

export default function MultiDatePickerWithTime({
  selectedDates,
  setSelectedDates,
  selectedTime,
  setSelectedTime,
  timeValidationError,
  setTimeValidationError,
}) {
  const [bookedDates, setBookedDates] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Alle brukerens egne bookinger
  const today = dayjs();
  const cutoffDate = today.add(14, "day");

  // Bruker Media Query for å tilpasse layout
  const isMobile = useMediaQuery("(max-width:600px)");

  // Lokal tilstand for tidsfeltet
  const [timeInput, setTimeInput] = useState("");

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const response = await csrfFetch("/api/get-valid-dates/", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Nettverksresponsen var ikke ok");
        }

        const data = await response.json(); // Parse JSON-responsen

        const booked = data.booked_dates
          ?.filter((booking) => booking && booking.date)
          .map((booking) => dayjs(booking.date));

        setBookedDates(
          data.booked_dates
            ?.filter((booking) => booking && booking.date)
            .map((booking) => ({
              date: dayjs(booking.date),
              room: booking.room || "Ukjent rom",
              time: booking.time || "Ukjent tid",
            }))
        );

        setAllBookings(booked);
      } catch (error) {
        console.error("Feil ved henting av datoer:", error);
      }
    };
    fetchDates();
  }, []);

  // Sort allBookings for effektiv sliding window
  const sortedBookings = useMemo(() => {
    return [...allBookings].sort((a, b) => a.diff(b));
  }, [allBookings]);

  // Compute invalid dates ved hjelp av optimalisert sliding window
  const invalidDates = useMemo(() => {
    const combinedBookings = [
      ...sortedBookings,
      ...selectedDates.map((d) => d),
    ];
    combinedBookings.sort((a, b) => a.diff(b)); // Sikre sortering

    const invalid = new Set();
    let start = 0;
    let end = 0;
    const bookingWindowStart = cutoffDate;
    const bookingWindowEnd = cutoffDate.add(60, "day");

    // Generer alle datoer innenfor vinduet
    const datesToCheck = [];
    for (
      let n = 0;
      n <= bookingWindowEnd.diff(bookingWindowStart, "day");
      n++
    ) {
      datesToCheck.push(bookingWindowStart.add(n, "day"));
    }

    for (let i = 0; i < datesToCheck.length; i++) {
      const currentDate = datesToCheck[i];
      const windowStartDate = currentDate.subtract(13, "day");

      // Flytt start pointer til første booking >= windowStartDate
      while (
        start < combinedBookings.length &&
        isSameOrBefore(combinedBookings[start], windowStartDate, "day")
      ) {
        start++;
      }

      // Tell bookinger opp til og med currentDate
      end = start;
      while (
        end < combinedBookings.length &&
        isSameOrBefore(combinedBookings[end], currentDate, "day")
      ) {
        end++;
      }

      const bookingsInWindow = end - start;

      if (bookingsInWindow >= 8) {
        invalid.add(currentDate.format("YYYY-MM-DD"));
      }
    }

    return Array.from(invalid).map((date) => dayjs(date));
  }, [sortedBookings, selectedDates, cutoffDate]);

  const handleDaySelect = useCallback(
    (date) => {
      const isAlreadySelected = selectedDates.some((d) =>
        d.isSame(date, "day")
      );

      if (isAlreadySelected) {
        // Fjerne datoen
        setSelectedDates((prevDates) =>
          prevDates.filter((d) => !d.isSame(date, "day"))
        );
      } else {
        // Legge til datoen
        const newDates = [...selectedDates, date];
        const adjustedDates = adjustSelectedDates(newDates);

        setSelectedDates(adjustedDates);
      }
    },
    [selectedDates, setSelectedDates]
  );

  const handleTimeChange = useCallback((e) => {
    const value = e.target.value;
    setTimeInput(value);
    // Ingen validering her
  }, []);

  const handleTimeBlur = useCallback(() => {
    // Utfør validering kun på blur
    const value = timeInput;

    if (value.length === 5) {
      const [hours, minutes] = value.split(":");
      const newTime = dayjs().hour(hours).minute(minutes);

      // Sjekk om den valgte tiden er innenfor tillatte grenser
      const minTime = dayjs().hour(8).minute(0);
      const maxTime = dayjs().hour(19).minute(30);
      const step = 15; // minutter

      if (
        newTime.isBefore(minTime) ||
        newTime.isAfter(maxTime) ||
        minutes % step !== 0
      ) {
        setTimeValidationError(true);
        setSelectedTime(null);
      } else {
        setSelectedTime(newTime);
        setTimeValidationError(false);
      }
    } else if (value.length === 0) {
      // Ingen verdi
      setSelectedTime(null);
      setTimeValidationError(false);
    } else {
      // Delvis input, ingen feilmelding
      setTimeValidationError(false);
    }
  }, [timeInput, setSelectedTime, setTimeValidationError]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          padding: 2,
          maxWidth: isMobile ? "100%" : "80%", // Tar full bredde på mobil, men 80% på desktop
          margin: "auto",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            fontSize: { xs: "1.4rem", sm: "1.8rem" },
            marginBottom: 2,
          }}
        >
          Velg datoer og klokkeslett
        </Typography>

        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={null}
          onChange={() => {}}
          renderInput={() => null}
          sx={{
            width: isMobile ? "100%" : "70%", // Full bredde på mobil, begrenset på desktop
          }}
          renderDay={(day, _, pickersDayProps) => {
            const isSelected = selectedDates.some((d) => d.isSame(day, "day"));
            const isInvalid =
              !isSelected &&
              (invalidDates.some((d) => d.isSame(day, "day")) ||
                day.isBefore(cutoffDate, "day"));
            const booking = bookedDates.find((b) => b.date.isSame(day, "day"));

            // Destrukturere 'key' fra 'pickersDayProps'
            const { key, ...otherProps } = pickersDayProps;

            return (
              <Tooltip
                title={
                  booking
                    ? `Rom: ${booking.room}, Tid: ${booking.time}`
                    : isInvalid
                      ? "Maks 8 bookinger tillatt i en periode på 14 dager."
                      : ""
                }
                arrow
              >
                <span>
                  <PickersDay
                    key={key} // Sett 'key' direkte
                    {...otherProps} // Spre de resterende propene
                    disabled={isInvalid}
                    selected={isSelected}
                    onClick={() => handleDaySelect(day)}
                    sx={{
                      backgroundColor: isSelected
                        ? "rgba(0, 123, 255, 0.3)"
                        : booking
                          ? "rgba(255, 193, 7, 0.3)"
                          : undefined,
                      "&:hover": {
                        backgroundColor: isSelected
                          ? "rgba(0, 123, 255, 0.5)"
                          : booking
                            ? "rgba(255, 193, 7, 0.5)"
                            : undefined,
                      },
                      border: isSelected
                        ? "1px solid rgba(0, 123, 255, 0.8)"
                        : undefined,
                    }}
                  />
                </span>
              </Tooltip>
            );
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "fit-content",
          }}
        >
          <TextField
            label="Velg tid"
            type="time"
            value={timeInput}
            onChange={handleTimeChange}
            onBlur={handleTimeBlur}
            error={timeValidationError}
            helperText={
              timeValidationError
                ? "Velg et tidspunkt mellom 08:00 og 19:30 hvert kvarter."
                : ""
            }
            inputProps={{
              step: 900, // 15 minutter i sekunder
              min: "08:00",
              max: "19:30",
            }}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              "& .MuiInputBase-input": {
                textAlign: "center",
                width: "100px",
              },
              "& .MuiOutlinedInput-root": {
                paddingRight: "10px",
              },
            }}
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );
}
