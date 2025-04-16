"use client";
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
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

interface StyledTextProps {
  variant: "primary" | "secondary";
}

const StyledText = styled("text", {
  shouldForwardProp: (prop) => prop !== "variant",
})<StyledTextProps>(({ theme }) => ({
  textAnchor: "middle",
  dominantBaseline: "central",
  fill: (theme.vars || theme).palette.text.secondary,
  variants: [
    {
      props: { variant: "primary" },
      style: { fontSize: theme.typography.h5.fontSize, fontWeight: theme.typography.h5.fontWeight },
    },
    {
      props: ({ variant }) => variant !== "primary",
      style: { fontSize: theme.typography.body2.fontSize, fontWeight: theme.typography.body2.fontWeight },
    },
  ],
}));

interface PieCenterLabelProps {
  primaryText: string;
  secondaryText: string;
}

function PieCenterLabel({ primaryText, secondaryText }: PieCenterLabelProps) {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
}

// Colors for the pie chart segments
const colors = [
  "hsl(200, 70%, 65%)",
  "hsl(200, 70%, 55%)",
  "hsl(200, 70%, 45%)",
  "hsl(200, 70%, 35%)",
  "hsl(200, 70%, 25%)",
];

const OrganizationMostPopularModules: React.FC<OrganizationMostPopularModulesProps> = ({ modules }) => {
  if (!modules || modules.length === 0) {
    return (
      <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            Most Popular Modules
          </Typography>
          <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>No data available.</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart
  const pieData = modules.map(mod => ({
    label: mod.module_name,
    value: mod.total_attempts || 0
  }));

  // Calculate total attempts for center label
  const totalAttempts = modules.reduce((sum, mod) => sum + (mod.total_attempts || 0), 0);

  // Calculate percentage for each module based on total attempts
  const modulesList = modules.map(mod => {
    const percentage = totalAttempts > 0 
      ? Math.round((mod.total_attempts || 0) / totalAttempts * 100) 
      : 0;
      
    return {
      name: mod.module_name,
      value: percentage,
      total_attempts: mod.total_attempts || 0,
      completed: mod.completed || 0,
      in_progress: mod.in_progress || 0,
      criteria: `${mod.passed_criteria || 'N/A'} / ${mod.total_criteria || 'N/A'}`,
      color: "", // Will be assigned during render
    };
  });

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" sx={{ fontWeight: "bold" }}>
          Most Popular Modules
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PieChart
            colors={colors}
            margin={{
              left: 80,
              right: 80,
              top: 80,
              bottom: 80,
            }}
            series={[
              {
                data: pieData,
                innerRadius: 75,
                outerRadius: 100,
                paddingAngle: 0,
                highlightScope: { faded: "global", highlighted: "item" },
              },
            ]}
            height={260}
            width={260}
            slotProps={{
              legend: { hidden: true },
            }}
          >
            <PieCenterLabel primaryText={`${totalAttempts}`} secondaryText="Total Attempts" />
          </PieChart>
        </Box>
        {modulesList.map((mod, index) => (
          <Stack
            key={mod.name}
            direction="row"
            sx={{ alignItems: "flex-start", gap: 2, pb: 2 }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: colors[index % colors.length],
                flexShrink: 0,
                mt: 0.5
              }}
            />
            <Stack sx={{ gap: 1, flexGrow: 1 }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "500" }}>
                  {mod.name}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {mod.value}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={mod.value}
                sx={{
                  [`& .${linearProgressClasses.bar}`]: {
                    backgroundColor: colors[index % colors.length],
                  },
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                <Typography component="span" variant="caption">Attempts: {mod.total_attempts}</Typography>
                <Typography component="span" variant="caption">Completed: {mod.completed}</Typography>
                <Typography component="span" variant="caption">In Progress: {mod.in_progress}</Typography>
                <Typography component="span" variant="caption">Criteria: {mod.criteria}</Typography>
              </Box>
            </Stack>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
};

export default OrganizationMostPopularModules;