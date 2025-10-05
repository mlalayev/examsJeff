import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Student dashboard routes
    if (path.startsWith("/dashboard/student")) {
      if (token?.role !== "STUDENT" && token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login?error=unauthorized", req.url));
      }
    }

    // Teacher dashboard routes
    if (path.startsWith("/dashboard/teacher")) {
      if (token?.role !== "TEACHER" && token?.role !== "ADMIN") {
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
  matcher: ["/dashboard/student/:path*", "/dashboard/teacher/:path*"],
};

