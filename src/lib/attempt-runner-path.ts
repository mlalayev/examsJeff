/**
 * Returns the client path for taking an in-progress attempt.
 * SAT Digital and IELTS Digital use dedicated runners; other categories keep the legacy route.
 */
export function attemptRunnerPath(
  attemptId: string,
  examCategory?: string | null
): string {
  if (examCategory === "SAT") {
    return `/attempts/${attemptId}/sat/run`;
  }
  if (examCategory === "IELTS") {
    return `/attempts/${attemptId}/ielts/run`;
  }
  return `/attempts/${attemptId}/run`;
}
