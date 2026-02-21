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

function ToolbarCourseIndicator() {
  const { selectedCourse, clearCourse } = useCourse();
  const router = useRouter();

  if (!selectedCourse) return null;

  const handleChange = () => {
    clearCourse();
    router.push("/courses");
  };

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
        onClick={handleChange}
        sx={{ whiteSpace: "nowrap", textTransform: "none" }}
      >
        Change Course
      </Button>
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
