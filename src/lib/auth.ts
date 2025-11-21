import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
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
          name: user.name,
          role: user.role,
          approved: (user as any).approved ?? false,
          branchId: (user as any).branchId ?? null,
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
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
        // OPTIMIZED: Only sync with DB every 5 minutes instead of every request
        const lastSyncTime = (token as any).lastSync || 0;
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        
        if (now - lastSyncTime > FIVE_MINUTES) {
          try {
            // Fetch user data in a single query (optimized)
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { 
                name: true, 
                role: true, 
                email: true, 
                branchId: true,
                approved: true,  // Get approved in same query
              },
            });
            
            if (dbUser) {
              token.name = dbUser.name ?? token.name;
              token.email = dbUser.email ?? token.email;
              (token as any).branchId = dbUser.branchId ?? null;
              token.role = dbUser.role as any;
              (token as any).approved = dbUser.approved ?? (token as any).approved ?? false;
              (token as any).lastSync = now;  // Update last sync time
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

