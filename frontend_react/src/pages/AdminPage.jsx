import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { csrfFetch } from "../csrf";
import Navbar from "../components/Navbar";

const AdminPage = () => {
  const [unapprovedUsers, setUnapprovedUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const [unapprovedResponse, activeResponse] = await Promise.all([
          axios.get("/api/unapproved-users/"), // API for å hente ikke-godkjente brukere
          axios.get("/api/active-users/"), // API for å hente aktive brukere
        ]);

        setUnapprovedUsers(unapprovedResponse.data);
        setActiveUsers(activeResponse.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await csrfFetch(`/api/approve/${userId}/`, {
        method: "POST",
      });
      setUnapprovedUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Er du sikker på at du vil fjerne denne brukeren?")) {
      return;
    }
    try {
      await csrfFetch(`/api/delete_user/${userId}/`, {
        method: "POST",
      });
      setActiveUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: 800, margin: "0 auto", padding: 4 }}>
        <Typography variant="h4" gutterBottom>
          Administrasjon
        </Typography>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <Box sx={{ marginBottom: 4 }}>
              <Typography variant="h5" gutterBottom>
                Brukere som venter på godkjenning
              </Typography>
              {unapprovedUsers.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Brukernavn</TableCell>
                        <TableCell>Sist aktiv</TableCell>
                        <TableCell>Handling</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unapprovedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.last_login
                              ? new Date(user.last_login).toLocaleString(
                                  "no-NO"
                                )
                              : "Aldri logget inn"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleApprove(user.id)}
                            >
                              Godkjenn
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Ingen brukere venter på godkjenning.</Typography>
              )}
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom>
                Aktive brukere
              </Typography>
              {activeUsers.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Brukernavn</TableCell>
                        <TableCell>Sist aktiv</TableCell>
                        <TableCell>Handling</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.last_login
                              ? new Date(user.last_login).toLocaleString(
                                  "no-NO"
                                )
                              : "Aldri logget inn"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => handleDelete(user.id)}
                            >
                              Fjern
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Ingen aktive brukere.</Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default AdminPage;
