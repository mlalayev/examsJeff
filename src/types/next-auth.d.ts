import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "TEACHER" | "ADMIN" | "BOSS" | "BRANCH_ADMIN" | "BRANCH_BOSS" | "CREATOR" | "PARENT";
      approved?: boolean;
      branchId?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "STUDENT" | "TEACHER" | "ADMIN" | "BOSS" | "BRANCH_ADMIN" | "BRANCH_BOSS" | "CREATOR" | "PARENT";
    approved?: boolean;
    branchId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | "BOSS" | "BRANCH_ADMIN" | "BRANCH_BOSS" | "CREATOR" | "PARENT";
    approved?: boolean;
    branchId?: string | null;
  }
}

