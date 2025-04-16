"use client";
import * as React from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from '@mui/material/CircularProgress'; // Import loading indicator
import ProfilePage from "./profile";
import { analyticsService } from "@/services/analyticsService";
import UserAnalyticsDisplay from "../components/UserAnalyticsDisplay";
import OrganizationAnalyticsDisplay from "../components/OrganizationAnalyticsDisplay";
import OrganizationTopCompletedModules from "../components/OrganizationTopCompletedModules";
import OrganizationMostPopularModules from "../components/OrganizationMostPopularModules";

// Define interfaces directly or import from a shared types file
interface ModuleStat {
  module_id: string | number;
  module_name: string;
  completion_rate?: number;
  total_attempts?: number;
  completed?: number;
  in_progress?: number;
  total_criteria?: number;
  passed_criteria?: number;
}

interface OrganizationAnalytics {
  total_modules_available?: number;
  total_module_sessions?: number;
  completed_sessions?: number;
  in_progress_sessions?: number;
  avg_completion_time_minutes?: number;
  overall_completion_rate_percentage?: number;
  total_active_users?: number;
  total_criteria_across_modules?: number;
  passed_criteria_across_modules?: number;
  criteria_completion_rate_percentage?: number;
  top_completed_modules?: ModuleStat[];
  most_popular_modules?: ModuleStat[];
}

interface UserAnalytics {
  // Define structure if needed for UserAnalyticsDisplay
  [key: string]: any; // Placeholder
}

interface AnalyticsData {
  organization_analytics?: OrganizationAnalytics;
  user_analytics?: UserAnalytics;
}

export default function DashboardContent() {
  const [analytics, setAnalytics] = React.useState<AnalyticsData>({});
  const [isLoading, setIsLoading] = React.useState(true); // Track loading state
  const [isClient, setIsClient] = React.useState(false); // Track if running on client

  React.useEffect(() => {
    setIsClient(true); // Component has mounted on the client
    let isMounted = true; // Prevent state update on unmounted component

    async function getAnalytics() {
      setIsLoading(true); // Start loading
      try {
        const analyticsData = await analyticsService();
        if (isMounted) {
          setAnalytics(analyticsData);
          console.log("Analytics data:", analyticsData);
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        // Optionally set an error state here
      } finally {
         if (isMounted) {
           setIsLoading(false); // Finish loading
         }
      }
    }
    getAnalytics();

    return () => {
      isMounted = false; // Cleanup function on unmount
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const organizationAnalytics = analytics.organization_analytics;

  // Render nothing or a basic skeleton during SSR and initial client render before mount
  if (!isClient) {
    // Important: This structure should be simple and match what the server sends initially.
    // Often returning null or a minimal placeholder is safest.
    return null; // Or return a consistent loading skeleton component if preferred
  }

  // Render loading indicator while fetching data
  if (isLoading) {
     return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
     );
  }

  // Render the actual content now that we are on the client and data is loaded (or failed)
  return (
    <Box sx={{ display: "flex" }}>
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          backgroundColor: theme.vars
            ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
            : alpha(theme.palette.background.default, 1),
          overflow: "auto",
        })}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
            mx: 3,
            pb: 5,
            mt: { xs: 8, md: 0 },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
            <ProfilePage />

            <Grid container spacing={3} sx={{ my: 2 }}>
              {/* Left Column */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <UserAnalyticsDisplay userAnalytics={analytics.user_analytics} />

                  {/* Most Popular Modules Card */}
                  <Card variant="outlined">
                    <CardContent>
                      {organizationAnalytics?.most_popular_modules && organizationAnalytics.most_popular_modules.length > 0 ? (
                        <OrganizationMostPopularModules modules={organizationAnalytics.most_popular_modules} />
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>Most Popular Modules</Typography>
                          <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', ml: 1 }}>No data available.</Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>

              {/* Right Column */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  {/* Organization Overview Card */}
                  {organizationAnalytics ? (
                     <OrganizationAnalyticsDisplay organizationAnalytics={organizationAnalytics} />
                  ) : (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="text.secondary">No organization analytics overview data available.</Typography>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Completed Modules Card */}
                  <Card variant="outlined">
                    <CardContent>
                      {organizationAnalytics?.top_completed_modules && organizationAnalytics.top_completed_modules.length > 0 ? (
                        <OrganizationTopCompletedModules modules={organizationAnalytics.top_completed_modules} />
                      ) : (
                        <>
                          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>Top Completed Modules</Typography>
                          <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', ml: 1 }}>No data available.</Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
