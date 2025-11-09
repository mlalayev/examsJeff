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
  if (role !== "BRANCH_ADMIN" && role !== "BOSS") {
    throw new Error("Forbidden: Branch admin or boss access required");
  }
  return user;
}

export function getScopedBranchId(user: any): string | null {
  if (user.role === "BOSS" || user.role === "ADMIN") {
    return null; // BOSS/ADMIN see all branches
  }
  // BRANCH_ADMIN, BRANCH_BOSS, and TEACHER see only their branch
  return user.branchId || null;
}

export function assertSameBranchOrBoss(current: any, targetBranchId: string | null | undefined) {
  const role = (current as any).role;
  const currentBranchId = (current as any).branchId ?? null;
  
  // BOSS and ADMIN can access all branches
  if (role === "BOSS" || role === "ADMIN") return;
  
  // If target has no branch, allow access (student might not be assigned to a branch yet)
  if (!targetBranchId) return;
  
  // BRANCH_ADMIN and BRANCH_BOSS can only access their own branch
  if (role === "BRANCH_ADMIN" && currentBranchId && currentBranchId === targetBranchId) return;
  if (role === "BRANCH_BOSS" && currentBranchId && currentBranchId === targetBranchId) return;
  
  throw new Error("Forbidden: Cross-branch access");
}

/**
 * Require ADMIN or BOSS role (for exam assignment, creation, etc.)
 */
export async function requireAdminOrBoss() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "ADMIN" && role !== "BOSS") {
    throw new Error("Forbidden: Admin or Boss access required");
  }
  
  return user;
}

/**
 * Require BRANCH_ADMIN or BRANCH_BOSS role (for branch-scoped operations)
 */
export async function requireBranchAdminOrBoss() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "BRANCH_ADMIN" && role !== "BRANCH_BOSS" && role !== "ADMIN" && role !== "BOSS") {
    throw new Error("Forbidden: Branch admin, branch boss, admin, or boss access required");
  }
  
  return user;
}

/**
 * Require BRANCH_BOSS role (for branch-level full access)
 */
export async function requireBranchBoss() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "BRANCH_BOSS" && role !== "BOSS") {
    throw new Error("Forbidden: Branch boss or boss access required");
  }
  
  return user;
}

/**
 * Require ADMIN or BRANCH_ADMIN role (for exam management)
 */
export async function requireAdminOrBranchAdmin() {
  const user = await requireAuth();
  const role = (user as any).role;
  
  if (role !== "ADMIN" && role !== "BRANCH_ADMIN" && role !== "BOSS") {
    throw new Error("Forbidden: Admin or Branch Admin access required");
  }
  
  return user;
}

