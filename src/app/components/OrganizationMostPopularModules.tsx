import * as React from 'react';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';

// Define ModuleStat interface (or import from a shared types file)
interface ModuleStat {
  module_id: string | number;
  module_name: string;
  total_attempts?: number;
  completed?: number;
  in_progress?: number;
  total_criteria?: number;
  passed_criteria?: number;
}

interface OrganizationMostPopularModulesProps {
  modules: ModuleStat[] | undefined;
}

const StyledListItem = styled(ListItem)(({ theme }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  alignItems: 'flex-start', // Align items to the start for better multi-line text
}));


const OrganizationMostPopularModules: React.FC<OrganizationMostPopularModulesProps> = ({ modules }) => {
  return (
    <>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
        Most Popular Modules
      </Typography>
      {modules && modules.length > 0 ? (
        <List dense disablePadding>
          {modules.map((mod) => (
            <StyledListItem key={mod.module_id} divider>
              <ListItemText
                primary={mod.module_name}
                secondary={
                  <Box component="span" sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                    <Typography component="span" variant="caption">Attempts: {mod.total_attempts ?? 'N/A'}</Typography>
                    <Typography component="span" variant="caption">Completed: {mod.completed ?? 'N/A'}</Typography>
                    <Typography component="span" variant="caption">In Progress: {mod.in_progress ?? 'N/A'}</Typography>
                    <Typography component="span" variant="caption">Criteria: {mod.passed_criteria ?? 'N/A'} / {mod.total_criteria ?? 'N/A'}</Typography>
                  </Box>
                }
                primaryTypographyProps={{ fontWeight: 'medium' }}
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

export default OrganizationMostPopularModules;