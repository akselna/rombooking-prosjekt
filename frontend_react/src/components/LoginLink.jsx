import react from "react";
import { Link, Typography } from "@mui/material";

const LoginLink = () => {
  return (
    <Typography align="center" sx={{ marginTop: 2 }}>
      Har du allerede en konto?{" "}
      <Link
        href="/login"
        color="primary"
        underline="hover"
        sx={{
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Logg inn her
      </Link>
    </Typography>
  );
};

export default LoginLink;
