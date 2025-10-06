import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireTeacher() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw new Error("Forbidden: Teacher access required");
  }
  
  return user;
}

export async function requireStudent() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "STUDENT" && role !== "ADMIN") {
    throw new Error("Forbidden: Student access required");
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  
  return user;
}

