import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Emergency cookie cleanup endpoint
 * Visit this endpoint to clear all auth-related cookies if you're having session issues
 */
export async function GET(req: NextRequest) {
  const response = NextResponse.json({ 
    message: "Cookies cleared. Please log in again.",
    cleared: [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.callback-url",
      "__Secure-next-auth.callback-url",
      "next-auth.csrf-token",
      "__Host-next-auth.csrf-token",
    ]
  });

  // Clear all possible auth cookie variants
  const cookieOptions = [
    { name: "next-auth.session-token", options: { path: "/", domain: "", maxAge: 0 } },
    { name: "__Secure-next-auth.session-token", options: { path: "/", domain: "", maxAge: 0, secure: true } },
    { name: "next-auth.callback-url", options: { path: "/", domain: "", maxAge: 0 } },
    { name: "__Secure-next-auth.callback-url", options: { path: "/", domain: "", maxAge: 0, secure: true } },
    { name: "next-auth.csrf-token", options: { path: "/", domain: "", maxAge: 0 } },
    { name: "__Host-next-auth.csrf-token", options: { path: "/", domain: "", maxAge: 0, secure: true } },
  ];

  // Set cookies to expire immediately
  cookieOptions.forEach(({ name, options }) => {
    response.cookies.set(name, "", options as any);
  });

  return response;
}
