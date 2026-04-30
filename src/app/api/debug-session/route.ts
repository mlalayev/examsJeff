import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  
  // Try to get token with both secure cookie schemes
  const tokenSecure = await getToken({ req, secret, secureCookie: true });
  const tokenInsecure = await getToken({ req, secret, secureCookie: false });
  
  // Get session using getServerSession
  const session = await getServerSession(authOptions);
  
  // Get all cookies
  const cookies = req.cookies.getAll();
  
  return NextResponse.json({
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
    tokenSecure: tokenSecure ? { id: tokenSecure.id, role: (tokenSecure as any).role } : null,
    tokenInsecure: tokenInsecure ? { id: tokenInsecure.id, role: (tokenInsecure as any).role } : null,
    session: session ? { userId: (session.user as any).id, role: (session.user as any).role } : null,
    cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value })),
    headers: {
      "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
      protocol: req.nextUrl.protocol,
    },
  });
}
