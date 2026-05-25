import PageHeader from "@/components/dashboard/student/PageHeader";
import LessonsList from "@/components/dashboard/student/LessonsList";

export const dynamic = "force-dynamic";

export default function KidsLessonsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Kids Lessons"
        description="Friendly English lessons designed for younger learners."
      />
      <LessonsList category="kids" />
    </div>
  );
}
