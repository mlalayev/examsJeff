import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Maps thrown errors to consistent JSON responses, matching the
 * inline pattern used across existing API routes:
 * - ZodError              -> 400 with the first validation message
 * - "Unauthorized"        -> 401 (thrown by requireAuth/requireTeacher)
 * - "Forbidden: ..."      -> 403 (thrown by role guards in auth-utils)
 * - anything else         -> 500 (logged with the given context)
 */
export function handleApiError(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }

  console.error(`${context}:`, error);
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}
