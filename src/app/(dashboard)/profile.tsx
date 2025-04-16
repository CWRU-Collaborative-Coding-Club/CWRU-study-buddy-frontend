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
      <Card variant="outlined" sx={{ mb: 2, p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!userProfile) {
     // Still show the card structure even if no data, but with a warning inside
     return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Typography component="h2" variant="subtitle2" gutterBottom>
                    User Profile
                </Typography>
                <Alert severity="warning">No profile data found.</Alert>
            </CardContent>
        </Card>
     );
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}> {/* Added variant="outlined" */}
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom> {/* Added Title */}
          User Profile
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src="/placeholder-avatar.png" // Placeholder image
            alt={`${userProfile.first_name} ${userProfile.last_name}`}
            sx={{ width: 56, height: 56 }} // Slightly smaller avatar to fit better
          />
          <Box>
            <Typography variant="body1" component="div" sx={{ fontWeight: 'medium' }}> {/* Adjusted variant */}
              {userProfile.first_name} {userProfile.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary"> {/* Adjusted variant */}
              {userProfile.email}
            </Typography>
            {/* <Typography variant="body2" color="text.secondary">
              Role: {getRoleName(userProfile.access_level)}
            </Typography> */}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}