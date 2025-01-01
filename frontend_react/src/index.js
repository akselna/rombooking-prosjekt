// index.js
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";

// MUI-relatert
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

// Egen kode
import App from "./App";
import theme from "./styles/theme"; // Din custom MUI-theme

ReactDOM.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </BrowserRouter>,
  document.getElementById("root")
);
