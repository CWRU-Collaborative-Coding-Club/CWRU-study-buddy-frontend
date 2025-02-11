import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import theme from "../theme";
import { Suspense } from "react";
import { signOutUser } from "./auth/signout";

const NAVIGATION: Navigation = [
  {
    kind: "header",
    title: "Main items",
  },
  {
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "orders",
    title: "Orders",
    icon: <ShoppingCartIcon />,
  },
  {
    kind: "divider",
  },
  {
    kind: "header",
    title: "Analytics",
  },
  {
    segment: "chat",
    title: "Chat",
    icon: <ShoppingCartIcon />,
    children: [
      {
        segment: "",
        title: "Chat",
      },
    ],
  },
];

const AUTHENTICATION = {
  signIn: async () => {
    "use server";
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signin";
    }
  },
  signOut: signOutUser,
};

const SESSION = {
  user: {
    email: "email",
    id: "email",
    image: "https://i.imgur.com/u6oVEqw.jpeg",
    name: "User",
  },
};

export default async function RootLayout({
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
            >
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </Suspense>
      </body>
    </html>
  );
}
