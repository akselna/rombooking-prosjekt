import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  List,
  ListItem,
  IconButton,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useMediaQuery,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import Navbar from "../components/Navbar";
import { csrfFetch } from "../csrf";
import BookingProgress from "../components/BookingProgress";

const HistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isMobile = useMediaQuery("(max-width:600px)");

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
          const futureBookings = data.bookings
            .filter(
              (booking) =>
                (booking.status === "pending" ||
                  booking.status === "processing") &&
                dayjs(booking.date, "DD.MM.YYYY").isAfter(dayjs(), "day") // Sjekker både status og fremtidig dato
            )
            .map((booking) => ({
              id: booking.id,
              date: booking.date,
              time: booking.time || "Ukjent tid",
              room: booking.room,
              campus: booking.campus,
              status: booking.status,
            }));
          setBookings(futureBookings);
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

  const handleDeleteSingleBooking = async (bookingId) => {
    setError("");
    setSuccess("");
    try {
      const response = await csrfFetch(`/api/delete-booking/${bookingId}/`, {
        method: "DELETE",
      });
      if (response.ok) {
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.id !== bookingId)
        );
        setSuccess("Booking slettet.");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Noe gikk galt ved sletting av booking.");
      }
    } catch (error) {
      console.error("Feil ved sletting av booking:", error);
      setError("Feil ved sletting av booking.");
    }
  };

  const handleDeleteAllClick = () => {
    setIsDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = async () => {
    setError("");
    setSuccess("");
    try {
      const deletePromises = bookings.map((booking) =>
        csrfFetch(`/api/delete-booking/${booking.id}/`, {
          method: "DELETE",
        })
      );
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter((res) => !res.ok);
      if (failedDeletes.length === 0) {
        setBookings([]);
        setSuccess("Alle bookinger er slettet.");
      } else {
        setError("Noen bookinger kunne ikke slettes.");
      }
    } catch (error) {
      console.error("Feil ved sletting av alle bookinger:", error);
      setError("Feil ved sletting av alle bookinger.");
    } finally {
      setIsDeleteAllDialogOpen(false);
    }
  };

  const handleDeleteAllCancel = () => {
    setIsDeleteAllDialogOpen(false);
  };

  return (
    <>
      <Container sx={{ padding: isMobile ? 2 : 4 }}>
        <Box sx={{ textAlign: "center", marginBottom: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: isMobile ? "1.4rem" : "1.8rem",
              fontWeight: "bold",
            }}
          >
            Bookinger
          </Typography>
        </Box>

        {/* Viser feilmelding eller suksessmelding */}
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ marginBottom: 2 }}>
            {success}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
            <CircularProgress />
          </Box>
        ) : bookings.length === 0 ? (
          <Typography
            variant="body1"
            sx={{
              textAlign: "center",
              fontSize: isMobile ? "1rem" : "1.2rem",
            }}
          >
            Ingen aktive bookinger.
          </Typography>
        ) : (
          <List
            sx={{
              backgroundColor: "background.paper",
              borderRadius: 2,
              padding: 2,
              boxShadow: 2,
              overflowX: "auto", // Legger til horisontal scrolling hvis nødvendig
            }}
          >
            {/* Overskriftsrad */}
            <ListItem
              sx={{
                backgroundColor: "background.default",
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: isMobile ? "column" : "row", // Endre retning basert på skjermstørrelse
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center", // Juster vertikal justering
                padding: isMobile ? 1 : 2, // Redusert padding på mobile
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  width: "100%",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    flex: isMobile ? "none" : 1,
                    fontWeight: "bold",
                    textAlign: isMobile ? "left" : "center",
                    marginBottom: isMobile ? 1 : 0,
                  }}
                >
                  Dato
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    flex: isMobile ? "none" : 1,
                    fontWeight: "bold",
                    textAlign: isMobile ? "left" : "center",
                    marginBottom: isMobile ? 1 : 0,
                  }}
                >
                  Tid
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    flex: isMobile ? "none" : 1,
                    fontWeight: "bold",
                    textAlign: isMobile ? "left" : "center",
                    marginBottom: isMobile ? 1 : 0,
                  }}
                >
                  Rom
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    flex: isMobile ? "none" : 1,
                    fontWeight: "bold",
                    textAlign: isMobile ? "left" : "center",
                    marginBottom: isMobile ? 1 : 0,
                  }}
                >
                  Campus
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    flex: isMobile ? "none" : 1,
                    fontWeight: "bold",
                    textAlign: isMobile ? "left" : "center",
                    marginBottom: isMobile ? 1 : 0,
                  }}
                >
                  Status
                </Typography>
              </Box>
              <Tooltip title="Slett alle bookinger">
                <IconButton
                  color="error"
                  onClick={handleDeleteAllClick}
                  sx={{ alignSelf: isMobile ? "flex-end" : "center" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItem>

            {/* Bookings */}
            {bookings.map((booking) => (
              <ListItem
                key={booking.id}
                sx={{
                  marginBottom: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row", // Endre retning basert på skjermstørrelse
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "center",
                  padding: 2, // Litt padding for en ryddig layout
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: isMobile ? "flex-start" : "center",
                  }}
                >
                  <Typography
                    sx={{
                      flex: isMobile ? "none" : 1,
                      textAlign: isMobile ? "left" : "center",
                      marginBottom: isMobile ? 0.5 : 0,
                    }}
                  >
                    {booking.date}
                  </Typography>
                  <Typography
                    sx={{
                      flex: isMobile ? "none" : 1,
                      textAlign: isMobile ? "left" : "center",
                      marginBottom: isMobile ? 0.5 : 0,
                    }}
                  >
                    {booking.time}
                  </Typography>
                  <Typography
                    sx={{
                      flex: isMobile ? "none" : 1,
                      textAlign: isMobile ? "left" : "center",
                      marginBottom: isMobile ? 0.5 : 0,
                    }}
                  >
                    {booking.room}
                  </Typography>
                  <Typography
                    sx={{
                      flex: isMobile ? "none" : 1,
                      textAlign: isMobile ? "left" : "center",
                      marginBottom: isMobile ? 0.5 : 0,
                    }}
                  >
                    {booking.campus}
                  </Typography>

                  {/* Status eller progress bar */}
                  <Box
                    sx={{
                      flex: isMobile ? "none" : 1,
                      textAlign: isMobile ? "left" : "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMobile ? "flex-start" : "center",
                      marginBottom: isMobile ? 0.5 : 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color:
                          booking.status === "confirmed"
                            ? "success.main"
                            : booking.status === "processing" ||
                                booking.status === "pending"
                              ? "warning.main" // Felles farge for "processing" og "pending"
                              : "error.main",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                      }}
                    >
                      {booking.status}
                    </Typography>

                    {/* Vis progressbar hvis status er "pending" eller "processing" */}
                    {(booking.status === "pending" ||
                      booking.status === "processing") && (
                      <Box
                        sx={{ marginTop: 1, width: isMobile ? "100%" : "auto" }}
                      >
                        <BookingProgress bookingId={booking.id} />
                      </Box>
                    )}
                  </Box>

                  <IconButton
                    color="error"
                    onClick={() => handleDeleteSingleBooking(booking.id)}
                    sx={{
                      alignSelf: isMobile ? "flex-end" : "center",
                      marginTop: isMobile ? 1 : 0,
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {/* Slett alle-dialog */}
        <Dialog open={isDeleteAllDialogOpen} onClose={handleDeleteAllCancel}>
          <DialogTitle>Bekreft sletting av alle bookinger</DialogTitle>
          <DialogContent>
            <Typography>
              Er du sikker på at du vil slette <strong>alle</strong> fremtidige
              bookinger?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteAllCancel} color="primary">
              Avbryt
            </Button>
            <Button onClick={handleDeleteAllConfirm} color="error">
              Slett alle
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default HistoryPage;
