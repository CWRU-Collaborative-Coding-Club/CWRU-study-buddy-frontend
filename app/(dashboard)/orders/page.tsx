"use client";
import * as React from "react";
import CustomDataGrid from "../../components/CustomDataGrid";
import { Button, TextField } from "@mui/material";

export default function OrdersPage() {
  return (
    <>
      <CustomDataGrid />
      <TextField
        variant="outlined"
        placeholder="email"
        sx={{ width: 300, marginTop: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        sx={{ marginTop: 2, width: 300 }}
      >
        Send email
      </Button>
    </>
  );
}
