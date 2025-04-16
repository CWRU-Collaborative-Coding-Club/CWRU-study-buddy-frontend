import * as React from "react";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import List from "@mui/material/List"; // No longer needed here
// import ListItem from "@mui/material/ListItem"; // No longer needed here
// import ListItemText from "@mui/material/ListItemText"; // No longer needed here
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid"; // Import Grid
// import Chip from "@mui/material/Chip"; // No longer needed here
import Box from "@mui/material/Box"; // Import Box for spacing
// import { styled } from '@mui/material/styles'; // No longer needed here
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Example Icon
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Example Icon
import GroupIcon from '@mui/icons-material/Group'; // Example Icon
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; // Example Icon
import AssessmentIcon from '@mui/icons-material/Assessment'; // Example Icon


// Keep ModuleStat definition if needed elsewhere or move to shared types
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

interface OrganizationAnalyticsDisplayProps {
  organizationAnalytics: OrganizationAnalytics | undefined;
}

// StyledListItem is removed as it's now defined within the specific list components

// Helper to render stat items in the grid
const renderGridItem = (icon: React.ReactNode, label: string, value: string | number | undefined) => (
  <Grid item xs={12} sm={6} md={4}>
    <Box display="flex" alignItems="center" mb={1}>
      {icon}
      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h5" component="div" fontWeight="medium">
      {value ?? 'N/A'}
    </Typography>
  </Grid>
);

// getCompletionChipColor is removed as it's now defined within OrganizationTopCompletedModules

const OrganizationAnalyticsDisplay: React.FC<OrganizationAnalyticsDisplayProps> = ({ organizationAnalytics }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Organization Analytics Overview
        </Typography>
        {organizationAnalytics ? (
          <>
            {/* Main Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {renderGridItem(<AssessmentIcon fontSize="small" />, "Total Modules Available", organizationAnalytics.total_modules_available)}
              {renderGridItem(<TrendingUpIcon fontSize="small" />, "Total Module Sessions", organizationAnalytics.total_module_sessions)}
              {renderGridItem(<CheckCircleOutlineIcon fontSize="small" color="success" />, "Completed Sessions", organizationAnalytics.completed_sessions)}
              {renderGridItem(<AccessTimeIcon fontSize="small" color="warning"/>, "In Progress Sessions", organizationAnalytics.in_progress_sessions)}
              {renderGridItem(<AccessTimeIcon fontSize="small" />, "Avg. Completion Time (min)", organizationAnalytics.avg_completion_time_minutes)}
              {renderGridItem(<CheckCircleOutlineIcon fontSize="small" />, "Overall Completion Rate (%)", organizationAnalytics.overall_completion_rate_percentage)}
              {renderGridItem(<GroupIcon fontSize="small" />, "Total Active Users", organizationAnalytics.total_active_users)}
              {renderGridItem(<AssessmentIcon fontSize="small" />, "Total Criteria", organizationAnalytics.total_criteria_across_modules)}
              {renderGridItem(<CheckCircleOutlineIcon fontSize="small" color="success" />, "Passed Criteria", organizationAnalytics.passed_criteria_across_modules)}
              {renderGridItem(<TrendingUpIcon fontSize="small" />, "Criteria Completion Rate (%)", organizationAnalytics.criteria_completion_rate_percentage)}
            </Grid>

          </>
        ) : (
          <Typography color="text.secondary">No organization analytics data available.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationAnalyticsDisplay;