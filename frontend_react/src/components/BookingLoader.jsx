// BookingLoader.jsx
import React from "react";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export default function BookingLoader({ isLoading, error, success }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 2,
      }}
    >
      {/* Loader */}
      <Box sx={{ height: 40 }}>
        {isLoading && (
          <Fade
            in={isLoading}
            style={{
              transitionDelay: isLoading ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        )}
      </Box>

      {/* Success Message */}
      {success && (
        <Typography sx={{ color: "green", marginTop: 2 }}>
          Booking vellykket!
        </Typography>
      )}

      {/* Error Message */}
      {error && (
        <Typography sx={{ color: "red", marginTop: 2 }}>{error}</Typography>
      )}
    </Box>
  );
}
