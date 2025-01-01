import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";

const CircularProgressWithLabel = ({ value }) => {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" value={value} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

const BookingProgress = ({ bookingId }) => {
  const [progress, setProgress] = useState(0); // Starter på 0%
  const [totalDelay, setTotalDelay] = useState(null); // Total tid for prosessen i sekunder

  useEffect(() => {
    const fetchBookingDelay = async () => {
      try {
        const response = await axios.get(`/api/get-booking/${bookingId}/`);
        const delay = response.data.progress_delay; // Total forsinkelse i sekunder
        setTotalDelay(delay);
      } catch (error) {
        console.error("Error fetching booking progress:", error);
        setTotalDelay(null); // Unngå progressbar hvis det oppstår en feil
      }
    };

    fetchBookingDelay();
  }, [bookingId]);

  useEffect(() => {
    if (totalDelay > 0) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const progressPerSecond = 100 / (totalDelay + 60);
          const nextProgress = prevProgress + progressPerSecond;

          if (nextProgress >= 100) {
            clearInterval(interval); // Stopper når fremgangen når 100%
            return 100;
          }

          return nextProgress;
        });
      }, 1000); // Oppdaterer hvert sekund

      return () => clearInterval(interval); // Rydd opp intervallet når komponenten demonteres
    }
  }, [totalDelay]);

  // Skjul progressbaren hvis `totalDelay` er null eller 0
  if (totalDelay === null || totalDelay === 0) {
    return null;
  }

  return <CircularProgressWithLabel value={progress} />;
};

export default BookingProgress;
