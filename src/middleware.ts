import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Session cookies use the __Secure- prefix when the *browser* hits HTTPS.
 * next-auth/middleware's getToken() only looks at NEXTAUTH_URL; if that is still http://
 * while users use https://, the JWT cookie name won't match and every protected route
 * looks logged-out. Derive secure cookies from the actual request (and proxy headers).
 */
function useSecureSessionCookie(req: NextRequest): boolean {
  const raw = req.headers.get("x-forwarded-proto");
  const first = raw?.split(",")[0]?.trim();
  if (first === "https") return true;
  if (first === "http") return false;
  if (req.nextUrl.protocol === "https:") return true;
  return process.env.NEXTAUTH_URL?.startsWith("https://") === true;
}

/** Try both cookie naming schemes — nginx / mixed NEXTAUTH_URL can leave one set wrong. */
async function getTokenFromRequest(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const preferSecure = useSecureSessionCookie(req);
  
  // Try preferred cookie scheme first
  let token = await getToken({ req, secret, secureCookie: preferSecure });
  
  // Fallback to opposite scheme if not found
  if (!token) {
    token = await getToken({ req, secret, secureCookie: !preferSecure });
  }
  
  // Additional debugging for production issues
  if (!token && process.env.NODE_ENV === 'production') {
    console.warn('[Auth] No token found for path:', req.nextUrl.pathname, 
      'Protocol:', req.nextUrl.protocol,
      'X-Forwarded-Proto:', req.headers.get("x-forwarded-proto"),
      'Tried secure:', preferSecure);
  }
  
  return token;
}

/**
 * Get security headers
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  };
}

export default async function middleware(req: NextRequest) {
  const token = await getTokenFromRequest(req);

  const path = req.nextUrl.pathname;

  if (!token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("callbackUrl", `${path}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next();
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CREATOR has full access to everything - no restrictions
  if ((token as any).role === "CREATOR") {
    return response;
  }

  // Student dashboard routes (must be approved unless elevated roles)
  if (path.startsWith("/dashboard/student")) {
    const approved = (token as any)?.approved ?? false;
    if (
      (token as any).role !== "STUDENT" &&
      (token as any).role !== "ADMIN" &&
      (token as any).role !== "BOSS" &&
      (token as any).role !== "BRANCH_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
    if ((token as any).role === "STUDENT" && !approved) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  // Teacher dashboard routes (must be approved unless elevated roles)
  if (path.startsWith("/dashboard/teacher")) {
    const approved = (token as any)?.approved ?? false;
    const allowed = ["TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN"];
    const role = (token as any).role as string | undefined;
    if (!role || !allowed.includes(role)) {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
    if ((token as any).role === "TEACHER" && !approved) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  // Admin dashboard routes (BOSS or ADMIN)
  if (path.startsWith("/dashboard/admin")) {
    const allowed = ["ADMIN", "BOSS"];
    if (!(token as any).role || !allowed.includes((token as any).role)) {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

  // Boss dashboard routes (BOSS only)
  if (path.startsWith("/dashboard/boss")) {
    if ((token as any).role !== "BOSS") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

  // Branch Admin dashboard routes (BRANCH_ADMIN or BOSS)
  if (path.startsWith("/dashboard/branch-admin")) {
    if ((token as any).role !== "BRANCH_ADMIN" && (token as any).role !== "BOSS") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pending",
    "/attempts/:path*",
  ],
};
