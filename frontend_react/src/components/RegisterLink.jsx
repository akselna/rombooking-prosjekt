import react from "react";
import { Link, Typography } from "@mui/material";

const RegisterLink = () => {
  return (
    <Typography align="center" sx={{ marginTop: 2 }}>
      Har du ikke en konto?{" "}
      <Link
        href="/register"
        color="primary"
        underline="hover"
        sx={{
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        Registrer deg her
      </Link>
    </Typography>
  );
};

export default RegisterLink;
