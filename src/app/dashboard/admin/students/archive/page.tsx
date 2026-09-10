import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function AdminArchivedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="ARCHIVED"
      studentsListHref="/dashboard/admin/students"
    />
  );
}
