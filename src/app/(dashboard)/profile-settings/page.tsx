"use client";
import * as React from "react";
import { Box, Button, TextField, Avatar, Typography } from "@mui/material";
import { getCookie } from "@/utils/cookies";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  email?: string;
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
}

export default function ProfileSettingsPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [preview, setPreview] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    const token = getCookie("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token as string);
        const displayName = decoded.name || `${decoded.first_name || ""} ${decoded.last_name || ""}`.trim();
        setName(displayName || "");
        setEmail(decoded.email || "");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleSave = async () => {
    // Placeholder: wire this to your backend upload/profile update endpoint.
    if (file) {
      // Example: upload to /api/upload or your storage provider
      console.log("Would upload file:", file.name);
    }
    console.log("Save profile for", { name, email });
    alert("Profile saved (placeholder). Implement API call to persist changes.");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 720 }}>
      <Typography variant="h5" gutterBottom>
        Profile settings
      </Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <Avatar src={preview ?? undefined} sx={{ width: 80, height: 80 }} />
        <Box>
          <Button variant="outlined" component="label">
            Change profile picture
            <input hidden accept="image/*" type="file" onChange={handleFile} />
          </Button>
          {preview && (
            <Button sx={{ ml: 1 }} onClick={() => { setFile(null); setPreview(null); }}>
              Remove
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr" }}>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Email" value={email} disabled />
      </Box>

      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={handleSave}>
          Save changes
        </Button>
        <Button variant="outlined" color="inherit" href="/">
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
