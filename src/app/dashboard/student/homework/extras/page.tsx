import PageHeader from "@/components/dashboard/student/PageHeader";
import HomeworkList from "@/components/dashboard/student/HomeworkList";

export const dynamic = "force-dynamic";

export default function StudentHomeworkExtrasPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Extras"
        description="Bonus exercises and extra practice materials."
      />
      <HomeworkList type="extras" />
    </div>
  );
}
