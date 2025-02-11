"use client";

import { getAuth, signOut } from "firebase/auth";
import { SIGNIN_PATH } from "@/constants";

export const signOutUser = async (): Promise<void> => {
  const auth = getAuth();
  try {
    await signOut(auth);
    if (typeof window !== "undefined") {
      window.location.href = SIGNIN_PATH;
    }
    console.log("User signed out successfully");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
