import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

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

  // Branch Admin dashboard routes (BRANCH_ADMIN only)
  if (path.startsWith("/dashboard/branch-admin")) {
    if (token?.role !== "BRANCH_ADMIN") {
      return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
    }
  }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/student/:path*",
    "/dashboard/teacher/:path*",
    "/dashboard/admin/:path*",
    "/dashboard/boss/:path*",
    "/dashboard/branch-admin/:path*",
    "/pending",
  ],
};

