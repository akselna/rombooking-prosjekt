import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Box,
  Pagination, // Importer Pagination-komponenten
} from "@mui/material";
import axios from "axios"; // Installer axios hvis det ikke allerede er installert

const RoomGrid = () => {
  const [rooms, setRooms] = useState([]); // Romdata fra API
  const [filterCapacity, setFilterCapacity] = useState(""); // Filtrering basert på kapasitet
  const [filterCampus, setFilterCampus] = useState(""); // Filtrering basert på campus
  const [currentPage, setCurrentPage] = useState(1); // Nåværende side
  const roomsPerPage = 6; // Antall rom per side
  const navigate = useNavigate(); // Navigasjonsfunksjon

  const handleCardClick = (roomId) => {
    navigate(`/book-room/${roomId}`); // Naviger til BookRoom-siden med rom-ID
  };

  // Hent romdata fra API ved lasting av komponenten
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get("/api/rooms/");
        setRooms(response.data); // Sett romdata i state
      } catch (error) {
        console.error("Feil ved henting av romdata:", error);
      }
    };

    fetchRooms();
  }, []);

  // Tilbakestill currentPage når filtrene endres
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCapacity, filterCampus]);

  // Filtrer romdata basert på brukerens valg
  const filteredRooms = rooms.filter((room) => {
    const matchesCapacity = filterCapacity
      ? room.capacity >= parseInt(filterCapacity)
      : true;
    const matchesCampus = filterCampus ? room.campus === filterCampus : true;
    return matchesCapacity && matchesCampus;
  });

  // Beregn rom som skal vises på den nåværende siden
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

  // Håndter sideendringer
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll til toppen av siden når siden endres
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ padding: 2 }}>
      {/* Filterseksjon */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          marginBottom: 4,
        }}
      >
        <TextField
          label="Minimum plasser"
          variant="outlined"
          type="number"
          value={filterCapacity}
          onChange={(e) => setFilterCapacity(e.target.value)}
          sx={{ width: "100%", maxWidth: 200 }}
        />
        <TextField
          select
          label="Velg campus"
          value={filterCampus}
          onChange={(e) => setFilterCampus(e.target.value)}
          sx={{ width: "100%", maxWidth: 200 }}
        >
          <MenuItem value="">Alle campus</MenuItem>
          <MenuItem value="Gløshaugen">Gløshaugen</MenuItem>
          <MenuItem value="Øya">Øya</MenuItem>
          <MenuItem value="Dragvoll">Dragvoll</MenuItem>
          <MenuItem value="Kalvskinnet">Kalvskinnet</MenuItem>
        </TextField>
      </Box>

      {/* Kortvisning */}
      <Grid container spacing={4} sx={{ paddingX: 2 }}>
        {currentRooms.map((room) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={room.name}
            onClick={() => handleCardClick(room.name)} // Klikk på romkortet
          >
            <Card
              sx={{
                maxWidth: 400,
                margin: "0 auto",
                backgroundColor: "#1e3a5f",
                color: "white",
                cursor: "pointer",
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out", // Smooth overgang
                "&:hover": {
                  transform: "scale(1.05)", // Øk størrelsen litt
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)", // Legg til skygge
                  backgroundColor: "#2a4a6f", // Endre bakgrunnsfarge ved hover
                },
              }}
            >
              <CardMedia
                component="img"
                loading="lazy" // Lazy loading
                sx={{
                  width: "100%",
                  height: 240,
                }}
                image={room.image_url} // Bildet fra API-et
                alt={room.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {room.name} - {room.building} {/* Romnavn og bygg */}
                </Typography>
                <Typography variant="body2">{room.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Paginering */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default RoomGrid;
