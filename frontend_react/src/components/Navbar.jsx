import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Importer useNavigate
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import MaterialUISwitch from "./CustomSwitch";
import { useThemeMode } from "../App"; // Import ThemeModeContext
import ApartmentIcon from "@mui/icons-material/Apartment";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const pages = [
  { name: "Book rom", path: "/book-room" },
  { name: "Kalender", path: "/calendar" },
  { name: "Bookinger", path: "/bookings" },
];

const settings = [
  {
    label: "Profil",
    action: () => {
      window.location.href = "/profile";
    },
  },
  {
    label: "Innstillinger",
    action: () => {
      window.location.href = "/settings";
    },
  },
  {
    label: "Logg ut",
    action: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      window.location.href = "/login";
    },
  },
];

function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const navigate = useNavigate();

  // Hent toggleTheme og mode fra ThemeModeContext
  const { toggleTheme, mode } = useThemeMode();

  // Sjekk om brukeren er admin
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/check-admin-status/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.is_admin);
        }
      } catch (error) {
        console.error("Feil ved sjekk av admin-status:", error);
      }
    };
    fetchUserRole();
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/*
            --- Desktop-modus (md: "flex") ---
            Ikon + tekst "ROMBOOKING" vises til venstre.
            Klikk på ikonet => navigate("/dashboard").
          */}
          <IconButton
            onClick={() => navigate("/dashboard")} // <--- Naviger til /dashboard
            color="inherit"
            sx={{ display: { xs: "none", md: "flex" }, mr: 2 }}
          >
            <ApartmentIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/dashboard"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            ROMBOOKING
          </Typography>

          {/*
            --- Telefon-modus (xs: "flex", md: "none") ---
            Viser hamburgermeny + Apartment-ikon til høyre (ml: "auto").
          */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            {/* Hamburgermeny */}
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={() => {
                    navigate(page.path);
                    handleCloseNavMenu();
                  }}
                >
                  <Typography sx={{ textAlign: "center" }}>
                    {page.name}
                  </Typography>
                </MenuItem>
              ))}
              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    navigate("/admin");
                    handleCloseNavMenu();
                  }}
                >
                  <Typography sx={{ textAlign: "center" }}>Admin</Typography>
                </MenuItem>
              )}
            </Menu>

            {/*
              Ikonet med "ml: auto" (margin-left: auto) plasseres til høyre for hamburgermenyen.
              Klikk => navigate("/dashboard").
            */}
            <IconButton
              onClick={() => navigate("/dashboard")} // <--- Naviger til /dashboard
              color="inherit"
              sx={{ ml: "auto" }}
            >
              <ApartmentIcon />
            </IconButton>
          </Box>

          {/*
            --- Desktop-menyer ---
          */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => navigate(page.path)}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page.name}
              </Button>
            ))}
            {isAdmin && (
              <Button
                onClick={() => navigate("/admin")}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                Admin
              </Button>
            )}
          </Box>

          {/* Mørk/lys-modus */}
          <Box sx={{ flexGrow: 0, display: "flex", alignItems: "center" }}>
            <MaterialUISwitch
              checked={mode === "dark"}
              onChange={toggleTheme}
            />
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 2 }}>
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* User-menu: Profil, Innstillinger, Logg ut */}
          <Menu
            sx={{ mt: "45px" }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              <MenuItem
                key={setting.label}
                onClick={() => {
                  setting.action();
                  handleCloseUserMenu();
                }}
              >
                <Typography sx={{ textAlign: "center" }}>
                  {setting.label}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
