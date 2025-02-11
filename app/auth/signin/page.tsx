"use client";
import * as React from "react";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import { SignInPage } from "@toolpad/core/SignInPage";
import { providerMap } from "../../../constants";
import { AuthProvider } from "@toolpad/core";
import {
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

function ForgotPasswordLink() {
  return (
    <span>
      <Link fontSize="0.75rem" href="/auth/forgot-password">
        Forgot password?
      </Link>
    </span>
  );
}

function SignUpLink() {
  return (
    <span style={{ fontSize: "0.8rem" }}>
      Don&apos;t have an account?&nbsp;<Link href="/auth/signup">Sign up</Link>
    </span>
  );
}

function DemoInfo() {
  return (
    <Alert severity="info">
      You can use <strong>toolpad-demo@mui.com</strong> with the password{" "}
      <strong>@demo1</strong> to test
    </Alert>
  );
}

async function firebaseSignIn(
  provider: AuthProvider,
  formData?: FormData,
  callbackUrl?: string
) {
  // Set persistence to local (persists across browser sessions)
  await setPersistence(auth, browserLocalPersistence);

  // Optionally, implement custom logic here for a 15-day expiration.
  // For example, store expiry timestamp in localStorage:
  const expiryDate = new Date().getTime() + 15 * 24 * 60 * 60 * 1000;
  localStorage.setItem("sessionExpiry", expiryDate.toString());

  if (provider.id === "credentials") {
    console.log("credentials", formData);
    const email = formData?.get("email")?.toString() || "";
    const password = formData?.get("password")?.toString() || "";
    if (!email || !password) {
      return { ok: false, error: "Email and password are required." };
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful");
      if (callbackUrl) {
        window.location.href = callbackUrl;
      }
      return { ok: true, redirectUrl: callbackUrl };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { ok: false, error: error.message };
    }
  } else if (provider.id === "google") {
    try {
      const googleProvider = new GoogleAuthProvider();
      await signInWithPopup(auth, googleProvider);
      if (callbackUrl) {
        window.location.href = callbackUrl;
      }
      return { ok: true, redirectUrl: callbackUrl };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
  return { ok: false };
}

export default function SignIn() {
  const user = auth.currentUser;
  if (user && typeof window !== "undefined") {
    window.location.href = "/";
    return null;
  }
  return (
    <SignInPage
      providers={providerMap}
      signIn={firebaseSignIn}
      slots={{
        forgotPasswordLink: ForgotPasswordLink,
        signUpLink: SignUpLink,
        subtitle: DemoInfo,
      }}
    />
  );
}
