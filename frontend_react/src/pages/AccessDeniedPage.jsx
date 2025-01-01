import React from "react";
import { Box, Typography, Container } from "@mui/material";

const AccessDeniedPage = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          padding: 2,
          textAlign: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "background.default",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Tilgang nektet
        </Typography>
        <Typography variant="body1" gutterBottom>
          Du har ikke tilgang til applikasjonen før profilen din er godkjent av
          en administrator.
        </Typography>
        <Typography variant="body1">Vennligst prøv igjen senere.</Typography>
      </Box>
    </Container>
  );
};

export default AccessDeniedPage;
