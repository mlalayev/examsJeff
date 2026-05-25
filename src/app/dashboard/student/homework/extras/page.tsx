import { Sparkles } from "lucide-react";
import ContentHero from "@/components/dashboard/student/ContentHero";
import HomeworkList from "@/components/dashboard/student/HomeworkList";

export const dynamic = "force-dynamic";

export default function StudentHomeworkExtrasPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <ContentHero
          title="Extras"
          description="Bonus exercises and extra practice materials."
          icon={Sparkles}
          accent="from-emerald-500 to-teal-600"
        />
        <HomeworkList type="extras" />
      </div>
    </div>
  );
}
