"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider
      // Base path for auth endpoints
      basePath="/api/auth"
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch session when window gains focus to catch expired sessions
      refetchOnWindowFocus={true}
      // Keep session data during revalidation to prevent flicker
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

