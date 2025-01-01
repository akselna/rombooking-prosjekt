import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import axios from "axios";
import { csrfFetch } from "../csrf";
import { useSearchParams } from "react-router-dom";

const SettingsPage = () => {
  const [feideUser, setFeideUser] = useState("");
  const [feidePassword, setFeidePassword] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false); // Ny tilstand for verifisering
  const [message, setMessage] = useState("");
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get("error");
  const googleConnectedParam = searchParams.get("google");

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get("/api/brukerdetaljer/");
        const data = response.data;
        setFeideUser(data.feide_user || "");
        setFeidePassword(data.feide_password || "");
        setGoogleConnected(data.google_connected || false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (errorParam) {
      // Vis en feilmelding
      setMessage("En feil oppstod ved Google-tilkobling.");
    } else if (googleConnectedParam === "connected") {
      // Vis en suksessmelding
      setMessage("Google-konto er nå koblet til!");
    }
  }, [errorParam, googleConnectedParam]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsVerifying(true); // Start verifisering
    setMessage("");

    try {
      const response = await csrfFetch("/api/brukerdetaljer/", {
        method: "POST",
        body: JSON.stringify({
          feide_user: feideUser,
          feide_password: feidePassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Detaljer lagret!");
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Ugyldig brukernavn eller passord.");
      }
    } catch (error) {
      console.error("Error saving user details:", error);
      setMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsVerifying(false); // Fullfør verifisering
    }
  };

  const handleGoogleConnect = async () => {
    try {
      window.location.href = "/api/google-login/"; // Redirect to Google login
    } catch (error) {
      console.error("Error connecting to Google:", error);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      // Bruk csrfFetch for å sende en POST med korrekt X-CSRFToken
      const response = await csrfFetch("/api/google-disconnect/", {
        method: "POST",
      });

      // Sjekk om alt gikk bra
      if (!response.ok) {
        throw new Error("Noe gikk galt ved kobling fra Google");
      }

      // Hent JSON-responsen fra Django
      const data = await response.json();

      // Oppdater React-state
      setGoogleConnected(false);
      setMessage(data.message || "Koblet fra Google Kalender.");
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      setMessage("Noe gikk galt. Prøv igjen.");
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 4,
          marginTop: 4,
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="h4" textAlign="center" gutterBottom>
          Fyll inn brukerdetaljer
        </Typography>
        {/* Viser loading-bar */}
        <form onSubmit={handleSave}>
          <TextField
            label="Feide-brukernavn"
            value={feideUser}
            onChange={(e) => setFeideUser(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Feide-passord"
            type="password"
            value={feidePassword}
            onChange={(e) => setFeidePassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          {message && (
            <Typography variant="body1" gutterBottom>
              {message}
            </Typography>
          )}
          {isVerifying && <LinearProgress sx={{ mb: 2 }} />}{" "}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isVerifying} // Deaktiver knappen under verifisering
            sx={{ mt: 2 }}
          >
            Lagre
          </Button>
        </form>
        <Box sx={{ textAlign: "center", marginTop: 4 }}>
          {googleConnected ? (
            <>
              <Typography variant="body1" gutterBottom>
                Du er koblet til Google Kalender.
              </Typography>
              <Button variant="contained" onClick={handleGoogleDisconnect}>
                Koble fra Google Kalender
              </Button>
            </>
          ) : (
            <Button variant="contained" onClick={handleGoogleConnect}>
              Koble til din Google Kalender
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
};

export default SettingsPage;
