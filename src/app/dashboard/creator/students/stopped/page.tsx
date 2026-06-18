import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function CreatorStoppedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="STOPPED"
      studentsListHref="/dashboard/creator/students"
    />
  );
}
