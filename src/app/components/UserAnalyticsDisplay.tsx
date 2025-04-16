import * as React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid"; // Import Grid
import Box from "@mui/material/Box";   // Import Box
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck'; // For criteria
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; // For rates/percentages
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck'; // For unique modules

interface UserAnalytics {
  total_modules_attempted?: number;
  completed_modules?: number;
  in_progress_modules?: number;
  unique_modules_engaged?: number;
  avg_completion_time_minutes?: number;
  completion_rate_percentage?: number;
  total_criteria?: number;
  passed_criteria?: number;
  criteria_completion_rate_percentage?: number;
}

interface UserAnalyticsDisplayProps {
  userAnalytics: UserAnalytics | undefined;
}

// Helper to render stat items in the grid
const renderGridItem = (icon: React.ReactNode, label: string, value: string | number | undefined) => (
    <Grid item xs={12} sm={6} md={4}> {/* Adjust grid sizing as needed */}
      <Box display="flex" alignItems="center" mb={1}>
        {icon}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h6" component="div" fontWeight="medium"> {/* Use h6 for slightly smaller stat value */}
        {value ?? 'N/A'}
      </Typography>
    </Grid>
  );


const UserAnalyticsDisplay: React.FC<UserAnalyticsDisplayProps> = ({ userAnalytics }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}> {/* Bolder Title */}
          User Analytics
        </Typography>
        {userAnalytics ? (
           <Grid container spacing={3}> {/* Use Grid container */}
             {renderGridItem(<AssessmentIcon fontSize="small" />, "Total Modules Attempted", userAnalytics.total_modules_attempted)}
             {renderGridItem(<CheckCircleOutlineIcon fontSize="small" color="success" />, "Completed Modules", userAnalytics.completed_modules)}
             {renderGridItem(<AccessTimeIcon fontSize="small" color="warning" />, "In Progress Modules", userAnalytics.in_progress_modules)}
             {renderGridItem(<PlaylistAddCheckIcon fontSize="small" />, "Unique Modules Engaged", userAnalytics.unique_modules_engaged)}
             {renderGridItem(<AccessTimeIcon fontSize="small" />, "Avg. Completion Time (min)", userAnalytics.avg_completion_time_minutes)}
             {renderGridItem(<DonutLargeIcon fontSize="small" />, "Completion Rate (%)", userAnalytics.completion_rate_percentage)}
             {renderGridItem(<FactCheckIcon fontSize="small" />, "Total Criteria", userAnalytics.total_criteria)}
             {renderGridItem(<CheckCircleOutlineIcon fontSize="small" color="success" />, "Passed Criteria", userAnalytics.passed_criteria)}
             {renderGridItem(<TrendingUpIcon fontSize="small" />, "Criteria Completion Rate (%)", userAnalytics.criteria_completion_rate_percentage)}
           </Grid>
        ) : (
          <Typography color="text.secondary">No user analytics data available.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAnalyticsDisplay;