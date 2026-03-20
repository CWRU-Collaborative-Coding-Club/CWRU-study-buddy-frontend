import { SIGNIN_PATH, SIGNUP_PATH } from "@/config/constants";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseMiddlewareClient } from "@/utils/supabase/middleware";

// Middleware will enforce JWT auth and (optionally) refresh Supabase sessions.
// JWT token cookie set on sign-in
const ACCESS_TOKEN_COOKIE = "token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths (sign-in, sign-up, static files)
  if (
    pathname === SIGNIN_PATH ||
    pathname === SIGNUP_PATH ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    // Not logged in → redirect to sign-in
    return NextResponse.redirect(new URL(SIGNIN_PATH, req.url));
  }

  try {
    // Logged in → refresh Supabase session cookies (if using Supabase Auth).
    return await createSupabaseMiddlewareClient(req);
  } catch {
    // This app uses a custom `token` cookie for API calls, so Supabase cookie-based
    // session refresh may be a no-op. Allow the request through regardless.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

