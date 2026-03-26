import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Create response with security headers
    let response = NextResponse.next();
    
    // Add security headers
    const headers = getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

  // CREATOR has full access to everything - no restrictions
  if (token?.role === "CREATOR") {
    return response;
  }

  // Student dashboard routes (must be approved unless elevated roles)
  if (path.startsWith("/dashboard/student")) {
    const approved = (token as any)?.approved ?? false;
    if (token?.role !== "STUDENT" && token?.role !== "ADMIN" && token?.role !== "BOSS" && token?.role !== "BRANCH_ADMIN") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
    if (token?.role === "STUDENT" && !approved) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  // Teacher dashboard routes (must be approved unless elevated roles)
  if (path.startsWith("/dashboard/teacher")) {
    const approved = (token as any)?.approved ?? false;
    const allowed = ["TEACHER", "ADMIN", "BOSS", "BRANCH_ADMIN"]; 
    if (!token?.role || !allowed.includes(token.role as any)) {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
    if (token?.role === "TEACHER" && !approved) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  // Admin dashboard routes (BOSS or ADMIN)
  if (path.startsWith("/dashboard/admin")) {
    const allowed = ["ADMIN", "BOSS"];
    if (!token?.role || !allowed.includes(token.role as any)) {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

  // Boss dashboard routes (BOSS only)
  if (path.startsWith("/dashboard/boss")) {
    if (token?.role !== "BOSS") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

  // Branch Admin dashboard routes (BRANCH_ADMIN or BOSS)
  if (path.startsWith("/dashboard/branch-admin")) {
    if (token?.role !== "BRANCH_ADMIN" && token?.role !== "BOSS") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pending",
    "/attempts/:path*",
  ],
};

