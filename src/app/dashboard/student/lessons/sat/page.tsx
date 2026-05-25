import { School } from "lucide-react";
import ContentHero from "@/components/dashboard/student/ContentHero";
import LessonsList from "@/components/dashboard/student/LessonsList";

export const dynamic = "force-dynamic";

export default function SatLessonsPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <ContentHero
          title="SAT Lessons"
          description="Lessons and resources to prepare for the SAT."
          icon={School}
          accent="from-sky-500 to-blue-600"
        />
        <LessonsList category="sat" />
      </div>
    </div>
  );
}
