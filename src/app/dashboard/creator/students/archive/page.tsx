import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function CreatorArchivedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="ARCHIVED"
      studentsListHref="/dashboard/creator/students"
    />
  );
}
