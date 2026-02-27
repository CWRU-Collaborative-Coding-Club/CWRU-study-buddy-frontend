"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "@/hooks/useAuth";
import { useCourse, Course } from "../../context/CourseContext";
import CoursesPage from "../courses";
import { DEPT_COLORS, STUDENT_COURSES } from "@/app/data/studentCourses";

function StudentCourseSelection() {
  const theme = useTheme();
  const router = useRouter();
  const { selectCourse } = useCourse();

  const handleSelect = (course: Course) => {
    selectCourse(course);
    router.push("/");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Select Your Course
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the course you are enrolled in to continue to the dashboard.
      </Typography>

      <Grid container spacing={2}>
        {STUDENT_COURSES.map((course) => {
          const color = DEPT_COLORS[course.department] || theme.palette.primary.main;
          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: alpha(color, 0.3),
                  transition: "border-color 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    borderColor: color,
                    boxShadow: `0 0 0 2px ${alpha(color, 0.15)}`,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleSelect(course)}
                  sx={{ height: "100%", alignItems: "flex-start", p: 0 }}
                >
                  <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* Department chip */}
                    <Chip
                      label={course.department}
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        borderRadius: 1,
                        bgcolor: alpha(color, 0.1),
                        color,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />

                    {/* Course ID + name */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 0.5 }}>
                      <MenuBookIcon sx={{ fontSize: 20, color, mt: 0.3, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {course.id}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                          {course.name}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Professor */}
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {course.professor}
                    </Typography>

                    {/* Modules */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: "auto" }}>
                      <PeopleIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                      <Typography variant="caption" color="text.secondary">
                        {course.modules} modules
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default function CoursesRoute() {
  const { isManager, loading } = useAuth();

  if (loading) return null;

  return isManager() ? <CoursesPage /> : <StudentCourseSelection />;
}
