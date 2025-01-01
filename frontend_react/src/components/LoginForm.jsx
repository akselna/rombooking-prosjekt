import React, { useState } from "react";
import { TextField, Box, Typography, Button } from "@mui/material";
import RegisterLink from "./RegisterLink";
import { useNavigate } from "react-router-dom";
import { csrfFetch } from "../csrf"; // Importer hjelpefunksjonen

const LoginForm = () => {
  const [username, setUsername] = useState(""); // Lagre brukernavn
  const [password, setPassword] = useState(""); // Lagre passord
  const [error, setError] = useState(""); // Feilmelding for skjemaet
  const navigate = useNavigate(); // Navigasjon til andre sider

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await csrfFetch("/api/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Lagre token i localStorage
        localStorage.setItem("access_token", data.access_token);

        // Naviger til dashboard
        navigate("/dashboard");
      } else {
        setError(data.error || "Ukjent feil oppstod.");
      }
    } catch (err) {
      console.error("Nettverksfeil:", err);
      setError("Noe gikk galt. Prøv igjen senere.");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw", // Sørg for at bredden også dekker hele skjermen
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default", // Bruker bakgrunnsfarge fra temaet
        overflow: "hidden", // Sikrer at ingenting går utenfor
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit} // Knyt handleSubmit til skjemaet
        sx={{
          width: { xs: "90%", sm: "400px" },
          padding: 4,
          margin: "auto",
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper", // Bruker papirbakgrunn fra temaet
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Logg inn
        </Typography>

        <TextField
          label="Brukernavn"
          variant="outlined"
          fullWidth
          value={username} // Binder input-feltet til username state
          onChange={(e) => setUsername(e.target.value)} // Oppdaterer username state
          sx={{ marginBottom: 2 }}
        />

        <TextField
          label="Passord"
          variant="outlined"
          type="password" // Skjuler input som passord
          fullWidth
          value={password} // Binder input-feltet til password state
          onChange={(e) => setPassword(e.target.value)} // Oppdaterer password state
          sx={{ marginBottom: 2 }}
        />
        {error && (
          <Typography
            variant="body2"
            align="center"
            color="error" // Bruker error-farge fra temaet
            sx={{ marginBottom: 2 }}
          >
            {error}
          </Typography>
        )}

        <Button
          type="submit" // Utløser skjemaets onSubmit
          variant="contained"
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Logg inn
        </Button>
        <RegisterLink sx={{ marginTop: 2 }} />
      </Box>
    </Box>
  );
};

export default LoginForm;
