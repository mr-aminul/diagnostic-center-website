import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { verifySessionToken } from "@/lib/session-token";

const intlMiddleware = createIntlMiddleware(routing);

const ADMIN_SESSION_COOKIE = "admin_session";
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

/**
 * Next.js 16 renamed middleware.ts to proxy.ts. This runs before every
 * request: it locale-routes the public site and gate-keeps /admin/* pages
 * (the actual role check for a specific page still happens server-side).
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.some((path) => pathname === path)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // Run on every route except static assets, API routes, and Next internals.
  // Admin vs. public dispatch happens inside proxy() above.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
