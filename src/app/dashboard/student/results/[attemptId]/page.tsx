import { redirect } from "next/navigation";

/** Canonical results live at /attempts/[attemptId]/results (includes Placement Test). */
export default async function StudentResultsRedirectPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  redirect(`/attempts/${attemptId}/results`);
}
