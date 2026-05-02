/**
 * Production Security Middleware for Next.js
 * Applied globally to add security headers and protections
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers configuration
 */
function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    
    // Enable XSS protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",
    
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    
    // Permissions policy (disable unnecessary features)
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  };

  // Content Security Policy (only if enabled)
  if (process.env.CSP_ENABLED === "true") {
    const reportOnly = process.env.CSP_REPORT_ONLY === "true";
    const headerName = reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
    
    headers[headerName] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
  }

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }

  return headers;
}

/**
 * Check if path should be protected by authentication
 */
function requiresAuth(pathname: string): boolean {
  const protectedPaths = [
    "/dashboard",
    "/attempts",
    "/api/attempts",
    "/api/admin",
    "/api/teacher",
    "/api/student",
    "/api/boss",
    "/api/branch-admin",
    "/api/creator",
  ];

  return protectedPaths.some((path) => pathname.startsWith(path));
}

/**
 * Check if path is a public API health endpoint
 */
function isHealthEndpoint(pathname: string): boolean {
  return pathname === "/api/health" || pathname === "/api/health/db";
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create response
  let response = NextResponse.next();

  // Apply security headers to all responses
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Maintenance mode check (except health endpoints)
  if (process.env.MAINTENANCE_MODE === "true" && !isHealthEndpoint(pathname)) {
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
        message: "The platform is currently under maintenance. Please try again later.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
          ...securityHeaders,
        },
      }
    );
  }

  // CORS headers for API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [
      "https://exams.jeff.az",
    ];

    // Allow CORS for allowed origins
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }

  return response;
}

/**
 * Configure which paths the middleware runs on
 * Exclude static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (static assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
