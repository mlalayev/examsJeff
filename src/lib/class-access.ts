/** Elevated staff who may list/manage any class (not only own teacherId). */
export function isClassManagerRole(role: string | undefined): boolean {
  return role === "CREATOR" || role === "ADMIN" || role === "BOSS";
}

/** Prisma `where` fragment for class ownership / visibility. */
export function classAccessWhere(user: {
  id: string;
  role?: string;
  branchId?: string | null;
}): Record<string, unknown> {
  if (isClassManagerRole(user.role)) {
    return {};
  }
  return {
    teacherId: user.id,
    ...(user.branchId ? { branchId: user.branchId } : {}),
  };
}
