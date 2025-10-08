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
  const approved = (user as any).approved ?? false;
  // BOSS and BRANCH_ADMIN have teacher-level privileges
  if (role !== "TEACHER" && role !== "ADMIN" && role !== "BOSS" && role !== "BRANCH_ADMIN") {
    throw new Error("Forbidden: Teacher access required");
  }
  if (role === "TEACHER" && !approved) {
    throw new Error("Forbidden: Approval required");
  }
  
  return user;
}

export async function requireStudent() {
  const user = await requireAuth();
  const role = (user as any).role;
  const approved = (user as any).approved ?? false;
  // BOSS and BRANCH_ADMIN have student-level privileges (read-only contexts typically)
  if (role !== "STUDENT" && role !== "ADMIN" && role !== "BOSS" && role !== "BRANCH_ADMIN") {
    throw new Error("Forbidden: Student access required");
  }
  if (role === "STUDENT" && !approved) {
    throw new Error("Forbidden: Approval required");
  }
  
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "ADMIN" && role !== "BOSS") {
    throw new Error("Forbidden: Admin access required");
  }
  
  return user;
}

export async function requireBoss() {
  const user = await requireAuth();
  const role = (user as any).role;
  if (role !== "BOSS") {
    throw new Error("Forbidden: Boss access required");
  }
  return user;
}

export async function requireBranchAdmin() {
  const user = await requireAuth();
  const role = (user as any).role;
  if (role !== "BRANCH_ADMIN") {
    throw new Error("Forbidden: Branch admin access required");
  }
  return user;
}

export function assertSameBranchOrBoss(current: any, targetBranchId: string | null | undefined) {
  const role = (current as any).role;
  const currentBranchId = (current as any).branchId ?? null;
  if (role === "BOSS") return;
  if (role === "BRANCH_ADMIN" && currentBranchId && targetBranchId && currentBranchId === targetBranchId) return;
  throw new Error("Forbidden: Cross-branch access");
}

