/**
 * Admin vs creator dashboard both list student exams; pick the matching API route.
 */
export function studentExamsApiUrl(studentId: string, pathname: string | null): string {
  const prefix = pathname?.startsWith("/dashboard/creator") ? "creator" : "admin";
  return `/api/${prefix}/students/${studentId}/exams`;
}
