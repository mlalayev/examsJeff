import StudentLifecycleDashboard from "@/components/dashboard/StudentLifecycleDashboard";

export default function AdminFinishedStudentsPage() {
  return (
    <StudentLifecycleDashboard
      bucket="FINISHED"
      studentsListHref="/dashboard/admin/students"
    />
  );
}
