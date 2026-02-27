"use client";
import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ChatIcon from "@mui/icons-material/Chat";
import UsersIcon from "@mui/icons-material/PeopleAlt";
import AgentsIcon from "@mui/icons-material/ViewModule";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import theme from "../../theme";
import { Suspense } from "react";
import { signOutUser } from "./auth/signout";
import { jwtDecode } from "jwt-decode";
import { CourseProvider, useCourse } from "./context/CourseContext";

interface DecodedToken {
  email: string;
  id: string;
  name: string;
  user_id?: string;
  access_level?: number;
  exp?: number;
  first_name?: string;
  last_name?: string;
}

function getUserRole(accessLevel: number | undefined): string {
  if (accessLevel === 9) return "Admin";
  if (accessLevel && accessLevel >= 5) return "Manager";
  if (accessLevel && accessLevel >= 1) return "Trainee";
  return "Guest";
}

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

const token = getCookie("token");

let user = { email: "", id: "", name: "", role: "Guest" };

if (token) {
  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    let displayName = decodedToken.name || "";
    if (!displayName && (decodedToken.first_name || decodedToken.last_name)) {
      displayName = `${decodedToken.first_name || ""} ${decodedToken.last_name || ""}`.trim();
    }
    user = {
      email: decodedToken.email,
      id: decodedToken.id || decodedToken.user_id || "",
      name: displayName,
      role: getUserRole(decodedToken.access_level),
    };
  } catch (error) {
    console.error("Invalid token:", error);
  }
}

const AUTHENTICATION = {
  signIn: () => {},
  signOut: signOutUser,
};

// Wrapper component so useCourse() is called inside CourseProvider
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { selectedCourse } = useCourse();

  const navigation: Navigation = React.useMemo(() => {
    if (!selectedCourse) {
      return [
        { segment: "courses", title: "Courses", icon: <LibraryBooksIcon /> },
      ];
    }
    return [
      { kind: "header", title: "Main items" },
      { title: "Dashboard: " + selectedCourse.name, icon: <DashboardIcon /> },
      { segment: "users", title: "Users", icon: <UsersIcon /> },
      { segment: "modules", title: "Modules", icon: <AgentsIcon /> },
      { segment: "chatHistory", title: "Chat History", icon: <ChatIcon /> },
    ];
  }, [selectedCourse]);

  const SESSION = {
    user: {
      email: user.email,
      id: user.id,
      name: user.name,
      role: user.role,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    },
  };

  return (
    <NextAppProvider
      theme={theme}
      navigation={navigation}
      authentication={AUTHENTICATION}
      session={SESSION}
      branding={{
        logo: <img src="/study-buddy-logo.png" alt="Logo" width={40} />,
        title: "StudyBuddy",
      }}
    >
      {children}
    </NextAppProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-toolpad-color-scheme="light">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <CourseProvider>
              <LayoutContent>{children}</LayoutContent>
            </CourseProvider>
          </AppRouterCacheProvider>
        </Suspense>
      </body>
    </html>
  );
}
