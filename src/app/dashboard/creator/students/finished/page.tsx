import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function CreatorFinishedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="FINISHED"
      studentsListHref="/dashboard/creator/students"
    />
  );
}
