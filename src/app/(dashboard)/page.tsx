"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import DashboardContent from "./DashboardContent";
import { getCookie } from "@/utils/cookies";
import { useCourse } from "../context/CourseContext";

function isLoggedIn() {
  return !!getCookie("token");
}

export default function Dashboard() {
  const router = useRouter();
  const { selectedCourse } = useCourse();

  React.useEffect(() => {
    if (!selectedCourse) {
      router.push("/courses");
    }
  }, [selectedCourse, router]);

  if (!isLoggedIn() || !selectedCourse) {
    return null;
  }

  return <DashboardContent />;
}
