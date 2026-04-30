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
  
  // Check which cookies are present
  const authCookies = cookies.filter(c => c.name.includes('next-auth'));
  
  return NextResponse.json({
    status: tokenSecure || tokenInsecure ? "AUTHENTICATED" : "NOT_AUTHENTICATED",
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
      useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === 'production',
    },
    tokens: {
      secure: tokenSecure ? { 
        id: tokenSecure.id, 
        role: (tokenSecure as any).role,
        approved: (tokenSecure as any).approved 
      } : null,
      insecure: tokenInsecure ? { 
        id: tokenInsecure.id, 
        role: (tokenInsecure as any).role,
        approved: (tokenInsecure as any).approved 
      } : null,
    },
    session: session ? { 
      userId: (session.user as any).id, 
      role: (session.user as any).role,
      approved: (session.user as any).approved 
    } : null,
    cookies: {
      all: cookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length || 0 })),
      authOnly: authCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length || 0 })),
    },
    headers: {
      "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
      protocol: req.nextUrl.protocol,
      host: req.headers.get("host"),
    },
  });
}
