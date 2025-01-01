// theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1e3a5f",
    },
    secondary: {
      main: "#415a77",
    },
    background: {
      default: "#121212", // Mørk hovedbakgrunn
      paper: "#1b263b",
    },
    text: {
      primary: "#d9e2ec",
      secondary: "#8899a6",
    },
  },
  typography: {
    fontFamily: "Montserrat, Poppins, Roboto, Arial, sans-serif", // Bruk den nye fonten her
    h6: {
      fontWeight: 600, // Tykkere for navbar-tekst
    },
    button: {
      fontWeight: 500, // For knappene i navbar
      textTransform: "uppercase", // Valgfritt for en mer "stilig" touch
    },
  },
  components: {
    /* …andre komponent-overstyringer… */
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Velg en HEX-farge som er litt lysere enn #121212
          backgroundColor: "#1c1c1c",
          // Du kan evt. prøve "#1f1f1f" for å se hvilken du liker best
          boxShadow: "none",
        },
      },
    },
  },
});

export default theme;
