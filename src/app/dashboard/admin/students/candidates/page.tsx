import { redirect } from "next/navigation";

export default function AdminExamCandidatesRedirect() {
  redirect("/dashboard/crm/exam-candidates");
}
