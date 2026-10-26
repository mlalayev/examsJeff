"use client";

import { SessionProvider as NextAuthSessionProvider, SessionContext, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";

// NextAuth v4 reports both a failed fetch and a signed-out session as null.
// Verify null independently before discarding the last authenticated UI state.
export function SessionRecovery({ children }: { children: React.ReactNode }) {
  const upstream = useSession();
  const [verified, setVerified] = useState<Session | null>(null);
  const [resolved, setResolved] = useState(false);
  const cached = useRef<Session | null>(null);
  useEffect(() => {
    if (upstream.data?.user) {
      cached.current = upstream.data;
      setVerified(upstream.data);
      setResolved(true);
      return;
    }
    if (upstream.status === 'loading') return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    let busy = false;
    let failures = 0;
    const check = async () => {
      if (stopped || busy) return;
      clearTimeout(timer);
      busy = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        if (!response.ok) throw new Error('Session service unavailable');
        const body = await response.json();
        if (body !== null && (typeof body !== 'object' || Array.isArray(body))) throw new Error('Invalid session response');
        if (body && Object.keys(body).length && (!body.user || typeof body.expires !== 'string')) throw new Error('Invalid session response');
        if (stopped) return;
        const session = body?.user ? body as Session : null;
        cached.current = session;
        setVerified(session);
        setResolved(true);
        failures = 0;
        // Continue refreshing even though NextAuth has stopped polling its null state.
        timer = setTimeout(check, 5 * 60 * 1000);
      } catch {
        if (stopped) return;
        if (cached.current && Date.parse(cached.current.expires) <= Date.now()) {
          cached.current = null; setVerified(null); setResolved(false);
        }
        timer = setTimeout(check, Math.min(30000, 2000 * 2 ** failures++));
      } finally { clearTimeout(timeout); busy = false; }
    };
    const visible = () => { if (document.visibilityState === 'visible') void check(); };
    const storage = (event: StorageEvent) => { if (event.key === 'nextauth.message') void check(); };
    void check();
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('storage', storage);
    return () => { stopped = true; clearTimeout(timer); controller?.abort(); window.removeEventListener('online', check); document.removeEventListener('visibilitychange', visible); window.removeEventListener('storage', storage); };
  }, [upstream.data, upstream.status]);
  const data = upstream.data || verified;
  const value = data
    ? { data, status: 'authenticated' as const, update: upstream.update }
    : { data: null, status: resolved ? 'unauthenticated' as const : 'loading' as const, update: upstream.update };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider basePath="/api/auth" refetchInterval={5 * 60} refetchOnWindowFocus refetchWhenOffline={false}>
    <SessionRecovery>{children}</SessionRecovery>
  </NextAuthSessionProvider>;
}
