import React, { useState } from "react";
import { TextField, Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LoginLink from "../components/LoginLink";
import { csrfFetch } from "../csrf"; // Importer hjelpefunksjonen

const RegisterUserPage = () => {
  const [username, setUsername] = useState(""); // Lagre brukernavn
  const [password, setPassword] = useState(""); // Lagre passord
  const [passwordConfirm, setPasswordConfirm] = useState(""); // Lagre passord
  const [error, setError] = useState(""); // Feilmelding for skjemaet

  const [usernameValid, setUsernameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordConfirmValid, setPasswordConfirmValid] = useState(false);

  const navigate = useNavigate(); // Navigasjon til andre sider

  const validateUsername = (value) => {
    const isValid = value.trim().length >= 3;
    setUsernameValid(isValid);
  };

  const validatePassword = (value) => {
    const isValid = value.trim().length >= 8;
    setPasswordValid(isValid);

    // Oppdater også bekreft passord hvis det allerede er skrevet inn
    validatePasswordConfirm(passwordConfirm, isValid);
  };

  const validatePasswordConfirm = (value, isPasswordValid = passwordValid) => {
    const isValid = isPasswordValid && value === password;
    setPasswordConfirmValid(isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usernameValid || !passwordValid || !passwordConfirmValid) {
      setError("Vennligst fyll ut alle felt korrekt.");
      return;
    }

    try {
      const response = await csrfFetch("/api/signup/", {
        method: "POST",
        body: JSON.stringify({ username, password, passwordConfirm }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.error || "Ukjent feil oppstod.");
      }
    } catch (err) {
      setError("Noe gikk galt. Prøv igjen senere.");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "background.default", // Bruker bakgrunnsfarge fra temaet
        overflow: "hidden",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: { xs: "90%", sm: "500px" },
          padding: 4,
          margin: "auto",
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper", // Bruker papirbakgrunn fra temaet
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Registrer deg
        </Typography>

        {/* Brukernavn */}
        <TextField
          label="Brukernavn"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => {
            const value = e.target.value;
            setUsername(value);
            validateUsername(value);
          }}
          error={!usernameValid && username !== ""}
          helperText={
            username !== "" && !usernameValid
              ? "Brukernavn må være minst 3 tegn."
              : usernameValid
                ? "Gyldig brukernavn!"
                : ""
          }
          sx={{ marginBottom: 2 }}
        />

        {/* Passord */}
        <TextField
          label="Passord"
          variant="outlined"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => {
            const value = e.target.value;
            setPassword(value);
            validatePassword(value);
          }}
          error={!passwordValid && password !== ""}
          helperText={
            password !== "" && !passwordValid
              ? "Passord må være minst 8 tegn."
              : passwordValid
                ? "Gyldig passord!"
                : ""
          }
          sx={{ marginBottom: 2 }}
        />

        {/* Bekreft passord */}
        <TextField
          label="Bekreft passord"
          variant="outlined"
          type="password"
          fullWidth
          value={passwordConfirm}
          onChange={(e) => {
            const value = e.target.value;
            setPasswordConfirm(value);
            validatePasswordConfirm(value);
          }}
          error={!passwordConfirmValid && passwordConfirm !== ""}
          helperText={
            passwordConfirm !== "" && !passwordConfirmValid
              ? "Passordene samsvarer ikke."
              : passwordConfirmValid
                ? "Passordene samsvarer!"
                : ""
          }
          sx={{ marginBottom: 5 }}
        />
        {error && (
          <Typography
            variant="body2"
            color="error" // Bruker error-farge fra temaet
            align="center"
            sx={{ marginBottom: 2 }}
          >
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ marginBottom: 2 }}
        >
          Bekreft registrering
        </Button>
        <LoginLink sx={{ marginBottom: 2 }} />
      </Box>
    </Box>
  );
};

export default RegisterUserPage;
