import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isApproved, setIsApproved] = useState(null); // Null indikerer at vi venter på godkjenningsstatus
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const fetchApprovalStatus = async () => {
      try {
        const response = await fetch("/api/check-approval-status/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Debugging: Logg responsen

        if (response.ok) {
          const data = await response.json();
          // Debugging: Logg data fra responsen

          setIsAuthenticated(true);
          setIsApproved(data.approved);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("[DEBUG] Feil ved sjekk av godkjenningsstatus:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatus();
  }, []);

  // Debugging: Logg lastestatus og verdier

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isApproved === false) {
    return <Navigate to="/access-denied" />;
  }

  return children;
};

export default RequireAuth;
