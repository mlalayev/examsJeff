import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  // NOTE: PrismaAdapter is NOT compatible with CredentialsProvider
  // Credentials use JWT sessions only, not database sessions
  // adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error("Invalid email format");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() }
        });

        if (!user || !user.passwordHash) {
          // Use constant-time comparison to prevent timing attacks
          // Hash a dummy password even if user doesn't exist
          await bcrypt.compare(credentials.password, "$2a$10$invalidhashtopreventtimingattacks");
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName || null,
          role: user.role,
          approved: (user as any).approved ?? false,
          branchId: (user as any).branchId ?? null,
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    updateAge: 60 * 60, // Update session every hour
  },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NEXTAUTH_URL?.startsWith("https://")
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NEXTAUTH_URL?.startsWith("https://")
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NEXTAUTH_URL?.startsWith("https://")
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith("https://") || process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        (token as any).approved = (user as any).approved ?? false;
        (token as any).branchId = (user as any).branchId ?? null;
      } else if (token?.id) {
        // OPTIMIZED: Only sync with DB every 30 seconds instead of every request
        const lastSyncTime = (token as any).lastSync || 0;
        const now = Date.now();
        const THIRTY_SECONDS = 30 * 1000; // Reduced from 5 minutes for faster approval updates
        
        if (now - lastSyncTime > THIRTY_SECONDS) {
          try {
            // Fetch user data in a single query (optimized)
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { 
                firstName: true,
                lastName: true, 
                role: true, 
                email: true, 
                branchId: true,
                approved: true,
              },
            });
            
            if (dbUser) {
              token.name = dbUser.firstName && dbUser.lastName ? `${dbUser.firstName} ${dbUser.lastName}` : dbUser.firstName || dbUser.lastName || token.name;
              token.email = dbUser.email ?? token.email;
              (token as any).branchId = dbUser.branchId ?? null;
              token.role = dbUser.role as any;
              (token as any).approved = dbUser.approved ?? (token as any).approved ?? false;
              (token as any).lastSync = now;
            }
          } catch {
            // Keep existing token data on error
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).name = token.name;
        (session.user as any).role = token.role;
        (session.user as any).approved = (token as any).approved ?? false;
        (session.user as any).branchId = (token as any).branchId ?? null;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

