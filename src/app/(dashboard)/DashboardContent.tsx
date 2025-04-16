"use client";
import * as React from "react";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import StatCard, { StatCardProps } from "../components/StatCard";
import HighlightedCard from "../components/HiglightedCard";
import SessionsChart from "../components/SessionsChart";
import PageViewsBarChart from "../components/PageViewsBarChart";
import CustomTreeView from "../components/CustomTreeView";
import ChartUserByCountry from "../components/ChartUserByCountry";
import ProfilePage from "./profile";
import { analyticsService } from "@/services/analyticsService";

const data: StatCardProps[] = [
  {
    title: "Users",
    value: "14k",
    interval: "Last 30 days",
    trend: "up",
    data: [
      200, 24, 220, 260, 240, 380, 100, 240, 280, 240, 300, 340, 320, 360, 340,
      380, 360, 400, 380, 420, 400, 640, 340, 460, 440, 480, 460, 600, 880, 920,
    ],
  },
  {
    title: "Conversions",
    value: "325",
    interval: "Last 30 days",
    trend: "down",
    data: [
      1640, 1250, 970, 1130, 1050, 900, 720, 1080, 900, 450, 920, 820, 840, 600,
      820, 780, 800, 760, 380, 740, 660, 620, 840, 500, 520, 480, 400, 360, 300,
      220,
    ],
  },
  {
    title: "Event count",
    value: "200k",
    interval: "Last 30 days",
    trend: "neutral",
    data: [
      500, 400, 510, 530, 520, 600, 530, 520, 510, 730, 520, 510, 530, 620, 510,
      530, 520, 410, 530, 520, 610, 530, 520, 610, 530, 420, 510, 430, 520, 510,
    ],
  },
];

export default function DashboardContent() {
  const [analytics, setAnalytics] = React.useState<{
    organization_analytics?: any;
    user_analytics?: any;
  }>({});

  React.useEffect(() => {
    async function getAnalytics() {
      try {
        const analyticsData = await analyticsService();
        setAnalytics(analyticsData);
        console.log("Analytics data:", analyticsData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    }
    getAnalytics();
  }, []);
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
            {/* cards */}
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              Profile
            </Typography>

            <ProfilePage />{ /* placeholder for profile card */ }

            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              Overview
            </Typography>
            {/* <Grid
              container
              spacing={2}
              columns={12}
              sx={{ mb: (theme) => theme.spacing(2) }}
            >
              {data.map((card, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <StatCard {...card} />
                </Grid>
              ))}
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <HighlightedCard />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SessionsChart />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <PageViewsBarChart />
              </Grid>

            </Grid> */}

            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              User Analytics
            </Typography>
            {analytics.user_analytics ? (
              <Box sx={{ mb: 3 }}>
                <Typography>
                  Total Modules Attempted:{" "}
                  {analytics.user_analytics.total_modules_attempted}
                </Typography>
                <Typography>
                  Completed Modules:{" "}
                  {analytics.user_analytics.completed_modules}
                </Typography>
                <Typography>
                  In Progress Modules:{" "}
                  {analytics.user_analytics.in_progress_modules}
                </Typography>
                <Typography>
                  Unique Modules Engaged:{" "}
                  {analytics.user_analytics.unique_modules_engaged}
                </Typography>
                <Typography>
                  Avg. Completion Time (min):{" "}
                  {analytics.user_analytics.avg_completion_time_minutes}
                </Typography>
                <Typography>
                  Completion Rate (%):{" "}
                  {analytics.user_analytics.completion_rate_percentage}
                </Typography>
                <Typography>
                  Total Criteria: {analytics.user_analytics.total_criteria}
                </Typography>
                <Typography>
                  Passed Criteria: {analytics.user_analytics.passed_criteria}
                </Typography>
                <Typography>
                  Criteria Completion Rate (%):{" "}
                  {analytics.user_analytics.criteria_completion_rate_percentage}
                </Typography>
              </Box>
            ) : (
              <Typography>No user analytics data available.</Typography>
            )}

            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              Organization Analytics
            </Typography>
            {analytics.organization_analytics ? (
              <Box sx={{ mb: 3 }}>
                <Typography>
                  Total Modules Available:{" "}
                  {analytics.organization_analytics.total_modules_available}
                </Typography>
                <Typography>
                  Total Module Sessions:{" "}
                  {analytics.organization_analytics.total_module_sessions}
                </Typography>
                <Typography>
                  Completed Sessions:{" "}
                  {analytics.organization_analytics.completed_sessions}
                </Typography>
                <Typography>
                  In Progress Sessions:{" "}
                  {analytics.organization_analytics.in_progress_sessions}
                </Typography>
                <Typography>
                  Avg. Completion Time (min):{" "}
                  {analytics.organization_analytics.avg_completion_time_minutes}
                </Typography>
                <Typography>
                  Overall Completion Rate (%):{" "}
                  {
                    analytics.organization_analytics
                      .overall_completion_rate_percentage
                  }
                </Typography>
                <Typography>
                  Total Active Users:{" "}
                  {analytics.organization_analytics.total_active_users}
                </Typography>
                <Typography>
                  Total Criteria Across Modules:{" "}
                  {
                    analytics.organization_analytics
                      .total_criteria_across_modules
                  }
                </Typography>
                <Typography>
                  Passed Criteria Across Modules:{" "}
                  {
                    analytics.organization_analytics
                      .passed_criteria_across_modules
                  }
                </Typography>
                <Typography>
                  Criteria Completion Rate (%):{" "}
                  {
                    analytics.organization_analytics
                      .criteria_completion_rate_percentage
                  }
                </Typography>
                <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                  Top Completed Modules:
                </Typography>
                {analytics.organization_analytics.top_completed_modules
                  ?.length > 0 ? (
                  analytics.organization_analytics.top_completed_modules.map(
                    (mod: any) => (
                      <Box key={mod.module_id} sx={{ ml: 2 }}>
                        <Typography>Module: {mod.module_name}</Typography>
                        <Typography>
                          Completion Rate: {mod.completion_rate}%
                        </Typography>
                        <Typography>
                          Total Attempts: {mod.total_attempts}
                        </Typography>
                      </Box>
                    )
                  )
                ) : (
                  <Typography sx={{ ml: 2 }}>No data</Typography>
                )}
                <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                  Most Popular Modules:
                </Typography>
                {analytics.organization_analytics.most_popular_modules?.length >
                0 ? (
                  analytics.organization_analytics.most_popular_modules.map(
                    (mod: any) => (
                      <Box key={mod.module_id} sx={{ ml: 2 }}>
                        <Typography>Module: {mod.module_name}</Typography>
                        <Typography>
                          Total Attempts: {mod.total_attempts}
                        </Typography>
                        <Typography>Completed: {mod.completed}</Typography>
                        <Typography>In Progress: {mod.in_progress}</Typography>
                        <Typography>
                          Total Criteria: {mod.total_criteria}
                        </Typography>
                        <Typography>
                          Passed Criteria: {mod.passed_criteria}
                        </Typography>
                      </Box>
                    )
                  )
                ) : (
                  <Typography sx={{ ml: 2 }}>No data</Typography>
                )}
              </Box>
            ) : (
              <Typography>No organization analytics data available.</Typography>
            )}
            {/* <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              Details
            </Typography>
            <Grid container spacing={2} columns={12}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Stack gap={2} direction={{ xs: "column", sm: "row" }}>
                  <CustomTreeView />
                  <ChartUserByCountry />
                </Stack>
              </Grid>
            </Grid> */}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
