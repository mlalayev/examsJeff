import PageHeader from "@/components/dashboard/student/PageHeader";
import LessonsList from "@/components/dashboard/student/LessonsList";

export const dynamic = "force-dynamic";

export default function IeltsLessonsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="IELTS Lessons"
        description="Lessons and resources to prepare for IELTS."
      />
      <LessonsList category="ielts" />
    </div>
  );
}
