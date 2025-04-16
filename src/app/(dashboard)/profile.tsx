"use client";

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip'; // Import Chip
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Example icon for placeholder
import { getMe } from '../../services/user'; // Adjust path as needed
import { UserProfile } from '../../models/user'; // Adjust path as needed

// Function to map access level to role name
const getRoleName = (accessLevel: number): string => {
  switch (accessLevel) {
    case 0: return 'Pending';
    case 1: return 'User';
    case 2: return 'Admin';
    case 3: return 'Super Admin';
    default: return 'Unknown Role';
  }
};

// Function to determine chip color based on role (optional styling)
const getRoleChipColor = (accessLevel: number): "primary" | "secondary" | "success" | "warning" | "error" | "default" => {
    switch (accessLevel) {
      case 3: return "error"; // Super Admin
      case 2: return "warning"; // Admin
      case 1: return "success"; // User
      case 0: return "secondary"; // Pending
      default: return "default";
    }
  };


export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const profileData = await getMe();
        // Simulate loading delay for testing UI
        // await new Promise(resolve => setTimeout(resolve, 1500));
        setUserProfile(profileData);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to load profile information.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <Card variant="outlined" sx={{ mb: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150 }}> {/* Added minHeight */}
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    // Wrap error in Card for consistency
    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                 <Typography component="h2" variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
                    User Profile
                </Typography>
                <Alert severity="error">{error}</Alert>
            </CardContent>
        </Card>
    );
  }

  if (!userProfile) {
     // Still show the card structure even if no data, but with a warning inside
     return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography component="h2" variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
                    User Profile
                </Typography>
                <Alert severity="warning">No profile data found.</Alert>
            </CardContent>
        </Card>
     );
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium', mb: 2 }}> {/* Added margin bottom */}
          User Profile
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            // src={userProfile.avatar_url || "/placeholder-avatar.png"} // Use actual avatar if available
            alt={`${userProfile.first_name} ${userProfile.last_name}`}
            sx={{ width: 60, height: 60 }} // Slightly larger avatar
          >
            {/* Fallback Icon if src fails or is not provided */}
            {!userProfile.avatar_url && <AccountCircleIcon sx={{ width: '100%', height: '100%' }} />}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}> {/* Allow text box to grow */}
            <Typography variant="h6" component="div" sx={{ fontWeight: 'medium' }}> {/* Use h6 for name */}
              {userProfile.first_name} {userProfile.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}> {/* Add margin bottom */}
              {userProfile.email}
            </Typography>
            {/* Display Role using a Chip */}
            {/* <Chip
                label={getRoleName(userProfile.access_level)}
                size="small"
                color={getRoleChipColor(userProfile.access_level)} // Use helper for color
                sx={{ mt: 0.5 }} // Add top margin
            /> */}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}