import { requireAuth } from "@/lib/auth-utils";

const HOMEWORK_MANAGER_ROLES = new Set([
  "CREATOR",
  "BOSS",
  "ADMIN",
  "TEACHER",
]);

export async function requireHomeworkManager() {
  const user = await requireAuth();
  const role = (user as { role?: string }).role;

  if (!role || !HOMEWORK_MANAGER_ROLES.has(role)) {
    throw new Error("Forbidden: Homework manager access required");
  }

  if (role === "TEACHER" && !(user as { approved?: boolean }).approved) {
    throw new Error("Forbidden: Approval required");
  }

  return user;
}

export function isTeacherRole(role: string | undefined): boolean {
  return role === "TEACHER";
}
