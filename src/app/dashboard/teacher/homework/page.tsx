import PageHeader from "@/components/dashboard/student/PageHeader";
import HomeworkManagementList from "@/components/dashboard/homework/HomeworkManagementList";

export const dynamic = "force-dynamic";

export default function TeacherHomeworkPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Homework"
        description="Homework assigned to your students."
      />
      <HomeworkManagementList
        apiBase="/api/teacher/homework"
        showTeacherColumn={false}
      />
    </div>
  );
}
