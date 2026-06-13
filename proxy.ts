import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Session gate: every route except `/login` requires a valid signed session cookie. */
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, getEnv().appPassword);

  if (pathname === "/login") {
    if (authed) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!authed) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
