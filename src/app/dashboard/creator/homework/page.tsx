import PageHeader from "@/components/dashboard/student/PageHeader";
import HomeworkManagementList from "@/components/dashboard/homework/HomeworkManagementList";

export const dynamic = "force-dynamic";

export default function CreatorHomeworkPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Homework"
        description="View all homework and extra assignments across students."
      />
      <HomeworkManagementList apiBase="/api/admin/homework" />
    </div>
  );
}
