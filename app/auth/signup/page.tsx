"use client";

import { auth, db } from "@/lib/firebase";
import Link from "@mui/material/Link";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Box, Button, Grid, Paper, TextField, Typography } from "@mui/material";

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;

      // Save additional user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        createdAt: new Date(),
      });

      // Sign in the user
      await signInWithEmailAndPassword(auth, form.email, form.password);

      // Show success message
      alert("User registered successfully!");
      console.log("Redirecting to dashboard...");
      router.push("/"); // Redirect to the dashboard page
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container justifyContent="center" alignItems="center" sx={{ height: "100vh", bgcolor: "#f4f4f4" }}>
      <Grid item xs={11} sm={8} md={6} lg={4}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Sign Up
          </Typography>
          <form onSubmit={handleSignup}>
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
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
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
