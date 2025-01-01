import React, { useState, useEffect, createContext, useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import SignInPage from "./pages/SignInPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import DashboardPage from "./pages/DashboardPage";
import BookRoomPage from "./pages/BookRoomPage";
import CalendarPage from "./pages/CalendarPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import "./App.css";
import "./index.css";

// Opprett en kontekst for tema
const ThemeModeContext = createContext();

// Tilpasset hook for å bruke ThemeModeContext
export const useThemeMode = () => useContext(ThemeModeContext);

const App = () => {
  // Leser tema fra localStorage ved første lasting, default til "light" om det ikke finnes.
  const [mode, setMode] = useState(
    () => localStorage.getItem("themeMode") || "light"
  );

  // Oppdaterer localStorage når temaet endres.
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  // Funksjon for å bytte mellom lys og mørk modus
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = createTheme({
    palette: {
      mode,
    },
  });

  const location = useLocation();

  // Definer ruter der Navbar skal skjules
  const hideNavbarRoutes = ["/login", "/register"];

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Navbar vises på alle sider unntatt de spesifiserte */}
        {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/register" element={<RegisterUserPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/book-room"
            element={
              <RequireAuth>
                <BookRoomPage />
              </RequireAuth>
            }
          />
          <Route
            path="/book-room/:roomId"
            element={
              <RequireAuth>
                <BookRoomPage />
              </RequireAuth>
            }
          />
          <Route
            path="/calendar"
            element={
              <RequireAuth>
                <CalendarPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <HistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <SettingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
        </Routes>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default App;
