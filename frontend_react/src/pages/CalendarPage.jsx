import React, { useEffect, useState, useMemo, useCallback } from "react";
import { StaticDatePicker, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  Typography,
  Tooltip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import { csrfFetch } from "../csrf"; // Sørg for at denne importen er korrekt

const CalendarPage = () => {
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme(); // Henter temaet fra Material-UI

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError("");
      setSuccess("");
      try {
        const response = await csrfFetch("/api/get-all-bookings/", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          const formattedBookings = data.bookings
            .filter(
              (booking) =>
                booking.status === "pending" || booking.status === "confirmed"
            )
            .map((booking) => ({
              id: booking.id,
              date: dayjs(booking.date, "DD.MM.YYYY"), // Juster formatet hvis nødvendig
              room: booking.booked_room || booking.room || "Ukjent rom", // Prioriter booked_room
              time: booking.time || "Ukjent tid",
              user: booking.user || "Ukjent bruker",
              campus: booking.campus || "Ukjent campus",
              status: booking.status,
            }));

          setBookedDates(formattedBookings);
        } else {
          const errorData = await response.json();
          setError(
            errorData.error || "Noe gikk galt ved henting av bookinger."
          );
        }
      } catch (error) {
        console.error("Feil ved henting av bookinger:", error);
        setError("Feil ved henting av bookinger.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getUpcomingBookings = useCallback(() => {
    const today = dayjs();
    return bookedDates
      .filter(
        (booking) =>
          booking.date.isAfter(today, "day") ||
          booking.date.isSame(today, "day")
      )
      .sort((a, b) => a.date - b.date)
      .slice(0, 3)
      .map((booking) => {
        const isToday = booking.date.isSame(today, "day");
        const isTomorrow = booking.date.isSame(today.add(1, "day"), "day");

        const startTime = dayjs(
          `${booking.date.format("YYYY-MM-DD")}T${booking.time}`
        );
        const endTime = startTime.add(4, "hour");

        return {
          ...booking,
          displayDate: isToday
            ? "I dag"
            : isTomorrow
              ? "I morgen"
              : booking.date.format("DD.MM.YYYY"),
          timeInterval: `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`,
        };
      });
  }, [bookedDates]);

  const upcomingBookings = useMemo(
    () => getUpcomingBookings(),
    [getUpcomingBookings]
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Grid
          container
          spacing={isMobile ? 2 : 4}
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems="stretch"
          sx={{ padding: isMobile ? 2 : 4 }}
        >
          {/* Kalenderen */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                padding: 2,
                borderRadius: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  marginBottom: 2,
                  fontSize: isMobile ? "1.4rem" : "1.8rem",
                }}
              >
                Kalenderoversikt
              </Typography>
              {isLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ textAlign: "center" }}>
                  {error}
                </Alert>
              ) : (
                <StaticDatePicker
                  displayStaticWrapperAs={isMobile ? "mobile" : "desktop"}
                  value={dayjs()}
                  onChange={() => {}}
                  components={{
                    Toolbar: () => null,
                  }}
                  componentsProps={{
                    actionBar: { actions: [] },
                  }}
                  renderDay={(day, _, pickersDayProps) => {
                    const booking = bookedDates.find((b) =>
                      b.date.isSame(day, "day")
                    );

                    return (
                      <Tooltip
                        title={
                          booking
                            ? `Rom: ${booking.room}, Tid: ${booking.time}, Campus: ${booking.campus}`
                            : ""
                        }
                        arrow
                      >
                        <span>
                          <PickersDay
                            {...pickersDayProps}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "40px",
                              height: "40px",
                              lineHeight: "40px",
                              margin: "0",
                              backgroundColor: booking
                                ? booking.status === "confirmed"
                                  ? "rgba(76, 175, 80, 0.3)" // Grønn farge for "confirmed"
                                  : "rgba(255, 193, 7, 0.3)" // Gul farge for andre statuser
                                : undefined,
                              "&:hover": {
                                backgroundColor: booking
                                  ? booking.status === "confirmed"
                                    ? "rgba(76, 175, 80, 0.5)"
                                    : "rgba(255, 193, 7, 0.5)"
                                  : undefined,
                              },
                              border: booking
                                ? booking.status === "confirmed"
                                  ? "1px solid rgba(76, 175, 80, 0.8)"
                                  : "1px solid rgba(255, 193, 7, 0.8)"
                                : undefined,
                            }}
                          />
                        </span>
                      </Tooltip>
                    );
                  }}
                  sx={{
                    "& .MuiSvgIcon-root[data-testid='PenIcon']": {
                      display: "none",
                    },
                  }}
                />
              )}
            </Box>
          </Grid>

          {/* Kommende bookinger */}
          <Grid item xs={12} md={6} sx={{ display: "flex" }}>
            <Box
              sx={{
                backgroundColor: theme.palette.background.paper,
                padding: 2,
                borderRadius: 2,
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  marginBottom: 2,
                  fontSize: isMobile ? "1.4rem" : "1.6rem",
                }}
              >
                Kommende bookinger
              </Typography>
              <List sx={{ flex: 1, overflow: "auto" }}>
                {upcomingBookings.length === 0 ? (
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: "center",
                      fontSize: isMobile ? "1rem" : "1.2rem",
                    }}
                  >
                    Ingen kommende bookinger.
                  </Typography>
                ) : (
                  upcomingBookings.map((booking, index) => (
                    <ListItem
                      key={booking.id}
                      sx={{
                        marginBottom: 2,
                        padding: isMobile ? 1 : 2,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        fontSize: isMobile ? "0.9rem" : "1rem",
                      }}
                    >
                      <ListItemText
                        primary={`${booking.displayDate}  ${booking.timeInterval}`}
                        secondary={`Rom: ${booking.room}, Campus: ${booking.campus}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default CalendarPage;
