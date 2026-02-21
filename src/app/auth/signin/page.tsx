"use client";
import * as React from "react";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import { SignInPage } from "@toolpad/core/SignInPage";
import { providerMap } from "@/config/constants";
import { AuthProvider } from "@toolpad/core";
import { useRouter } from "next/navigation";
import { signIn } from "@/services/user";
import { getCookie } from "@/utils/cookies";

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
    <></>
  );
}

interface LocalAuthResponse {
  ok: boolean;
  error?: string;
  redirectUrl?: string;
}

async function JWTSignIn(
  provider: AuthProvider,
  formData?: FormData,
  callbackUrl?: string
): Promise<LocalAuthResponse> {
  if (provider.id === "credentials") {
    const email = formData?.get("email")?.toString() || "";
    const password = formData?.get("password")?.toString() || "";
    if (!email || !password) {
      return { ok: false, error: "Email and password are required." };
    }
    try {
      // Replace fetch call with API function
      const response = await signIn({
        email,
        password,
      });

      const { token } = response;

      // Store the JWT in a cookie with a 3-day expiry
      document.cookie = `token=${token}; path=/; max-age=${3 * 24 * 60 * 60}`;

      console.log("Sign in successful");

      // Redirect to the home page after successful sign-in
      return { ok: true, redirectUrl: "/courses" };
    } catch (error: any) {
      console.error("Sign in error:", error);
      return { ok: false, error: error.message };
    }
  } else if (provider.id === "google") {
    // Handle Google sign-in
    return { ok: false, error: "Google sign-in not implemented." };
  }
  return { ok: false, error: "Unsupported provider." };
}

function isLoggedIn() {
  return !!getCookie("token");
}

export default function SignIn() {
  const router = useRouter();
  const [signInResponse, setSignInResponse] =
    React.useState<LocalAuthResponse | null>(null);

  React.useEffect(() => {
    if (isLoggedIn() && typeof window !== "undefined") {
      router.push("/courses"); // Redirect to course selection if already logged in
    }
  }, [router]);

  React.useEffect(() => {
    if (signInResponse?.ok && signInResponse.redirectUrl) {
      router.push(signInResponse.redirectUrl); // Redirect after successful sign-in
    }
  }, [signInResponse, router]);

  return (
    <SignInPage
      providers={providerMap}
      signIn={async (provider, formData, callbackUrl) => {
        const response = await JWTSignIn(provider, formData, callbackUrl);
        setSignInResponse(response); // Update state with the sign-in response
        return response;
      }}
      slots={{
        forgotPasswordLink: ForgotPasswordLink,
        signUpLink: SignUpLink,
        subtitle: DemoInfo,
      }}
    />
  );
}
