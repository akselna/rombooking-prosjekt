import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material";
import axios from "axios";
import Navbar from "../components/Navbar";

const ProfilePage = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/brukerdetaljer/");
        const data = response.data;
        setUserDetails(data);
        setGoogleConnected(data.google_connected || false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleGoogleDisconnect = async () => {
    try {
      const response = await axios.post("/api/google-disconnect/");
      setGoogleConnected(false);
      setMessage(response.data.message || "Koblet fra Google Kalender.");
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      setMessage("Noe gikk galt. Prøv igjen.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Er du sikker på at du vil slette kontoen din?")) {
      return;
    }
    try {
      await axios.post("/api/delete_user/self/");
      alert("Kontoen din er slettet.");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error deleting account:", error);
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
          Min profil
        </Typography>

        {message && (
          <Typography variant="body1" color="error.main" gutterBottom>
            {message}
          </Typography>
        )}

        {userDetails && (
          <>
            <Typography variant="body1" gutterBottom>
              <strong>Brukernavn:</strong> {userDetails.username}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Tilkoblet feide-bruker:</strong> {userDetails.feide_user}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Godkjent profil:</strong>{" "}
              {userDetails.profile_approved ? "Ja" : "Nei"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Google Kalender
            </Typography>
            {googleConnected ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Du er koblet til Google Kalender.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleGoogleDisconnect}
                >
                  Koble fra Google Kalender
                </Button>
              </>
            ) : (
              <Typography variant="body1" gutterBottom>
                Du er ikke koblet til Google Kalender.
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleDeleteAccount}
            >
              Slett konto
            </Button>
          </>
        )}
      </Box>
    </>
  );
};

export default ProfilePage;
