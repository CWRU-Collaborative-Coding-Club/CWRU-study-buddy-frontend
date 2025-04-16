import * as React from 'react';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';

// Define ModuleStat interface (or import from a shared types file)
interface ModuleStat {
  module_id: string | number;
  module_name: string;
  completion_rate?: number;
  total_attempts?: number;
}

interface OrganizationTopCompletedModulesProps {
  modules: ModuleStat[] | undefined;
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  alignItems: 'center', // Keep items centered vertically for this layout
}));

// Helper to determine chip color based on completion rate
const getCompletionChipColor = (rate: number | undefined): "success" | "warning" | "error" | "default" => {
  if (rate === undefined || rate === null) return "default";
  if (rate >= 85) return "success";
  if (rate >= 60) return "warning";
  return "error";
};

const OrganizationTopCompletedModules: React.FC<OrganizationTopCompletedModulesProps> = ({ modules }) => {
  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
        Top Completed Modules
      </Typography>
      {modules && modules.length > 0 ? (
        <List dense disablePadding>
          {modules.map((mod) => (
            <StyledListItem key={mod.module_id} divider>
              <ListItemText
                primary={mod.module_name}
                secondary={`Attempts: ${mod.total_attempts ?? 'N/A'}`}
                primaryTypographyProps={{ fontWeight: 'medium', mb: 0.5 }}
              />
              <Chip
                label={`${mod.completion_rate ?? 'N/A'}% Complete`}
                color={getCompletionChipColor(mod.completion_rate)}
                size="small"
                sx={{ ml: 2 }}
              />
            </StyledListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ fontStyle: 'italic', color: 'text.secondary', ml: 1 }}>No data available.</Typography>
      )}
    </>
  );
};

export default OrganizationTopCompletedModules;