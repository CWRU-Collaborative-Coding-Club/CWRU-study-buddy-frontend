"use client";
import * as React from "react";
import DashboardContent from "./DashboardContent";
import { auth } from "@/lib/firebase";
import { SIGNIN_PATH } from "@/constants";

export default function Dashboard() {
  const user = auth.currentUser;
  if (!user && typeof window !== "undefined") {
    window.location.href = SIGNIN_PATH;
    return null;
  }
  return <DashboardContent />;
}
