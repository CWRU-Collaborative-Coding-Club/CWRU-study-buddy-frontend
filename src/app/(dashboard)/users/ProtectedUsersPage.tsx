"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import UsersPageOriginal from "./page";
import { getCookie } from "@/utils/cookies";

interface User {
  access_level: number;
}

const ProtectedUsersPageContent: React.FC = () => {
  const [accessLevel, setAccessLevel] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = getCookie("token");
      if (token) {
        try {
          const response = await fetch("/api/getCurrentUser", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          const data: User = await response.json();
          setAccessLevel(data.access_level);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setAccessLevel(null);
        }
      } else {
        setAccessLevel(null);
      }
    };

    fetchUserData();
  }, []);

  if (accessLevel === null) {
    return <Typography>Loading...</Typography>;
  }

  if (accessLevel < 5) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Access Denied</Typography>
        <Typography>You do not have permission to access this page.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <UsersPageOriginal />
    </Box>
  );
};

export default ProtectedUsersPageContent;
