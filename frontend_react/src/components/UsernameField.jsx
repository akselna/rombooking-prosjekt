import react from "react";
import { TextField } from "@mui/material";

const UsernameField = ({ value, onChange }) => {
  return (
    <TextField
      label="Username"
      id="username"
      value={value}
      onChange={onChange}
    />
  );
};

export default UsernameField;
