"use client";
import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ChatIcon from "@mui/icons-material/Chat";
import UsersIcon from "@mui/icons-material/PeopleAlt";
import AgentsIcon from "@mui/icons-material/ViewModule";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import theme from "../../theme";
import { Suspense } from "react";
import { signOutUser } from "./auth/signout";
import { jwtDecode } from "jwt-decode";

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

// Helper function to determine role based on access level
function getUserRole(accessLevel: number | undefined): string {
  if (accessLevel === 9) return 'Admin';
  if (accessLevel && accessLevel >= 5) return 'Manager';
  if (accessLevel && accessLevel >= 1) return 'Trainee';
  return 'Guest';
}

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

const token = getCookie("token");

let user = {
  email: "",
  id: "",
  name: "",
  role: "Guest",
};

if (token) {
  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    
    // Determine the display name - check if we have both components or just a combined name
    let displayName = decodedToken.name || '';
    if (!displayName && (decodedToken.first_name || decodedToken.last_name)) {
      displayName = `${decodedToken.first_name || ''} ${decodedToken.last_name || ''}`.trim();
    }
    
    user = {
      email: decodedToken.email,
      id: decodedToken.id || decodedToken.user_id || '',
      name: displayName,
      role: getUserRole(decodedToken.access_level),
    };
  } catch (error) {
    console.error("Invalid token:", error);
  }
}

const NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "Main items",
  },
  {
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  // {
  //   segment: "orders",
  //   title: "Orders",
  //   icon: <ShoppingCartIcon />,
  // },
  {
    segment: "users",
    title: "Users",
    icon: <UsersIcon />,
  },
  {
    segment: "modules",
    title: "Modules",
    icon: <AgentsIcon />,
  },
  {
    segment: "chatHistory",
    title: "Chat History",
    icon: <ChatIcon/>,
  },
];

const AUTHENTICATION = {
  signIn: () => {},
  signOut: signOutUser,
};

const SESSION = {
  user: {
    email: user.email,
    id: user.id,
    image:
      "https://www.google.com/url?sa=i&url=https%3A%2F%2Fpngtree.com%2Ffree-png-vectors%2Fuser-profile&psig=AOvVaw1N1zxnySa37enNtU9CcFCX&ust=1741322668203000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCKiIi8zS9IsDFQAAAAAdAAAAABAQ",
    name: user.name,
    role: user.role, // Add role information
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-toolpad-color-scheme="light">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NextAppProvider
              theme={theme}
              navigation={NAVIGATION}
              authentication={AUTHENTICATION}
              session={SESSION}
              branding={{
                logo: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                      marginLeft: "1rem",
                    }}
                  >
                    <img
                      src="/study-buddy-logo.png"
                      alt="StudyBuddy logo"
                      width={100}
                    />
                  </div>
                ),
                title: "",
                homeUrl: "/",
              }}
            >
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </Suspense>
      </body>
    </html>
  );
}
