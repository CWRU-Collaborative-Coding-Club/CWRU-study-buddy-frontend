"use client";
import * as React from "react";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import Copyright from "../components/Copyright";
import SidebarFooterAccount, {
  ToolbarAccountOverride,
} from "./SidebarFooterAccount";
import { useCourse } from "../context/CourseContext";
import { useRouter } from "next/navigation";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import { STUDENT_COURSES } from "@/app/data/studentCourses";
import type { Course } from "../context/CourseContext";

function ToolbarCourseIndicator() {
  const { selectedCourse, selectCourse } = useCourse();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!selectedCourse) return null;

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery("");
  };

  const handleSelectCourse = (course: Course) => {
    selectCourse(course);
    handleClose();
    router.push("/");
  };

  const handleGoToCourses = () => {
    handleClose();
    router.push("/courses");
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredCourses = !query
    ? STUDENT_COURSES
    : STUDENT_COURSES.filter((course) => {
        return (
          course.name.toLowerCase().includes(query) ||
          course.id.toLowerCase().includes(query) ||
          course.professor.toLowerCase().includes(query) ||
          course.department.toLowerCase().includes(query)
        );
      });

  const isDropdownOpen = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
      <Chip
        label={selectedCourse.name}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}
      />
      <Button
        size="small"
        variant="text"
        startIcon={<SwapHorizIcon fontSize="small" />}
        onClick={handleOpen}
        sx={{ whiteSpace: "nowrap", textTransform: "none" }}
      >
        Change Course
      </Button>
      <Popover
        open={isDropdownOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ p: 1.5, width: { xs: "calc(100vw - 32px)", sm: 420 }, maxWidth: 420 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 1.25 }}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleGoToCourses}
              sx={{ whiteSpace: "nowrap", textTransform: "none", px: 1.5 }}
            >
              All Courses
            </Button>
          </Box>
          <Box
            sx={{
              maxHeight: 150,
              overflowY: "auto",
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
            }}
          >
            {filteredCourses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                No courses match your search.
              </Typography>
            ) : (
              <List dense disablePadding>
                {filteredCourses.map((course) => (
                  <ListItemButton
                    key={course.id}
                    selected={selectedCourse.id === course.id}
                    onClick={() => handleSelectCourse(course)}
                  >
                    <ListItemText
                      primary={course.name}
                      secondary={`${course.id} • ${course.department}`}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      slots={{
        toolbarActions: ToolbarCourseIndicator,
        toolbarAccount: ToolbarAccountOverride,
        sidebarFooter: SidebarFooterAccount,
      }}
      sidebarExpandedWidth={280}
    >
      <PageContainer>
        {props.children}
        <Copyright sx={{ my: 4 }} />
      </PageContainer>
    </DashboardLayout>
  );
}
