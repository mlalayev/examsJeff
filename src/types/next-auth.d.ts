import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "STUDENT" | "TEACHER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "STUDENT" | "TEACHER" | "ADMIN";
  }
}

