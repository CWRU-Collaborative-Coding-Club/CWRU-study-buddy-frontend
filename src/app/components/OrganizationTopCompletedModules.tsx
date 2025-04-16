"use client";
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
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

// Helper to determine chip color based on completion rate
const getCompletionChipColor = (rate: number | undefined): "success" | "warning" | "error" | "default" => {
  if (rate === undefined || rate === null) return "default";
  if (rate >= 85) return "success";
  if (rate >= 60) return "warning";
  return "error";
};

// Colors for the pie chart segments
const colors = [
  "hsl(140, 70%, 65%)",
  "hsl(140, 70%, 55%)",
  "hsl(140, 70%, 45%)",
  "hsl(140, 70%, 35%)",
  "hsl(140, 70%, 25%)",
];

const OrganizationTopCompletedModules: React.FC<OrganizationTopCompletedModulesProps> = ({ modules }) => {
  if (!modules || modules.length === 0) {
    return (
      <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            Top Completed Modules
          </Typography>
          <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>No data available.</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart - using completion rates
  const pieData = modules.map(mod => ({
    label: mod.module_name,
    value: mod.completion_rate || 0
  }));

  // Calculate average completion rate for center label
  const avgCompletionRate = modules.length > 0
    ? Math.round(modules.reduce((sum, mod) => sum + (mod.completion_rate || 0), 0) / modules.length)
    : 0;

  // Calculate percentage for display
  const modulesList = modules.map(mod => {
    const normalizedValue = mod.completion_rate || 0;
    
    return {
      name: mod.module_name,
      value: normalizedValue,
      completion_rate: mod.completion_rate || 0,
      total_attempts: mod.total_attempts || 0,
      color: "", // Will be assigned during render
    };
  });

  // Sort modules by completion rate for display
  modulesList.sort((a, b) => b.completion_rate - a.completion_rate);

  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" sx={{ fontWeight: "bold" }}>
          Top Completed Modules
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
            <PieCenterLabel primaryText={`${avgCompletionRate}%`} secondaryText="Avg Completion" />
          </PieChart>
        </Box>
        {modulesList.map((mod, index) => (
          <Stack
            key={mod.name}
            direction="row"
            sx={{ alignItems: "center", gap: 2, pb: 2 }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: colors[index % colors.length],
                flexShrink: 0
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", mr: 1 }}>
                    Attempts: {mod.total_attempts}
                  </Typography>
                  <Chip
                    label={`${mod.completion_rate}% Complete`}
                    color={getCompletionChipColor(mod.completion_rate)}
                    size="small"
                  />
                </Box>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={mod.completion_rate}
                sx={{
                  [`& .${linearProgressClasses.bar}`]: {
                    backgroundColor: colors[index % colors.length],
                  },
                }}
              />
            </Stack>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
};

export default OrganizationTopCompletedModules;