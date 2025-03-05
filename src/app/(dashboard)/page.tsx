"use client";
import * as React from "react";
import DashboardContent from "./DashboardContent";
import { SIGNIN_PATH } from "@/config/constants";
import { getCookie } from "@/utils/cookies";


function isLoggedIn() {
  return !!getCookie("token");
}

export default function Dashboard() {
  React.useEffect(() => {
    if (!isLoggedIn() && typeof window !== "undefined") {
      window.location.href = SIGNIN_PATH;
    }
  }, []);

  if (!isLoggedIn()) {
    return null;
  }

  return <DashboardContent />;
}
