"use client";

import { SIGNIN_PATH } from "@/config/constants";

export const signOutUser = async (): Promise<void> => {
  try {
    // Clear the JWT cookie
    document.cookie = "token=; path=/; max-age=0";

    if (typeof window !== "undefined") {
      window.location.href = SIGNIN_PATH;
    }
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
