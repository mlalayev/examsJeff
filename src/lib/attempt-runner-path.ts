/**
 * Returns the client path for taking an in-progress attempt.
 * SAT Digital uses a dedicated runner; other categories keep the legacy route.
 */
export function attemptRunnerPath(
  attemptId: string,
  examCategory?: string | null
): string {
  if (examCategory === "SAT") {
    return `/attempts/${attemptId}/sat/run`;
  }
  return `/attempts/${attemptId}/run`;
}
