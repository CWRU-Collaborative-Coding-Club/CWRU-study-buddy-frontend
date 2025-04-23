"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  Link,
} from "@mui/material";
import { signUp } from "@/services/user";

export default function SignUp() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await signUp({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        password: form.password,
      });

      const { token } = response;

      // Store the JWT in a cookie
      document.cookie = `token=${token}; path=/; max-age=${3 * 24 * 60 * 60}`;

      alert("User registered successfully!");
      router.push("/"); // Redirect to the dashboard page
    } catch (error: any) {
      // Handle structured validation errors
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        // Format validation errors
        const errorMessages = error.response.data.detail.map((err: any) => {
          // Extract field name from location path (e.g., ["body", "password"] -> "password")
          const field = err.loc && err.loc.length > 1 ? err.loc[1] : 'unknown field';
          
          // Create a readable field name with first letter capitalized
          const readableField = field.charAt(0).toUpperCase() + field.slice(1);
          
          // Just return the error message for password fields without showing the value
          return field === 'password' ? 
            `Password must contain at least one special character` : 
            `${readableField}: ${err.msg}`;
        }).join('\n');
        
        setError(errorMessages);
      } else {
        // Handle other types of errors
        setError(error.response?.data?.detail || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      sx={{ height: "100vh", bgcolor: "#f4f4f4" }}
    >
      <Grid item xs={11} sm={8} md={6} lg={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Sign Up
          </Typography>
          <form onSubmit={handleSignUp}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Confirm Password"
                variant="outlined"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </Box>
            {error && (
              <Box sx={{ mb: 2, p: 1, borderRadius: 1 }}>
                <Typography color="error">
                  {error.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </Typography>
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account? <Link href="/auth/signin">Sign In</Link>
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
