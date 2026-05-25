import PageHeader from "@/components/dashboard/student/PageHeader";
import LessonsList from "@/components/dashboard/student/LessonsList";

export const dynamic = "force-dynamic";

export default function GeneralEnglishLessonsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="General English Lessons"
        description="Lessons to build everyday English fluency."
      />
      <LessonsList category="general" />
    </div>
  );
}
