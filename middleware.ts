import { NextRequest, NextResponse } from "next/server";

import { SIGNIN_PATH, SIGNUP_PATH } from "@/config/constants";

export async function middleware(req: NextRequest) {
  if (
    // req.nextUrl.pathname !== SIGNIN_PATH &&
    // req.nextUrl.pathname !== SIGNUP_PATH
    false
  ) {
    return NextResponse.redirect(new URL(SIGNIN_PATH, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
