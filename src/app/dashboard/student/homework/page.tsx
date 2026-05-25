import PageHeader from "@/components/dashboard/student/PageHeader";
import HomeworkList from "@/components/dashboard/student/HomeworkList";

export const dynamic = "force-dynamic";

export default function StudentHomeworkPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Homeworks"
        description="All your assigned homework, in one place."
      />
      <HomeworkList type="regular" />
    </div>
  );
}
