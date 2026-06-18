import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function AdminStoppedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="STOPPED"
      studentsListHref="/dashboard/admin/students"
    />
  );
}
