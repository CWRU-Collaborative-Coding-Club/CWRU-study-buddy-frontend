"use client";
import * as React from "react";
import DashboardContent from "./DashboardContent";
import { getCookie } from "@/utils/cookies";

function isLoggedIn() {
  return !!getCookie("token");
}

export default function Dashboard() {
  if (!isLoggedIn()) {
    return null;
  }

  return <DashboardContent />;
}
