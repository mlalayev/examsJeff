import { BookOpen } from "lucide-react";
import ContentHero from "@/components/dashboard/student/ContentHero";
import WordListsList from "@/components/dashboard/student/WordListsList";

export const dynamic = "force-dynamic";

export default function WordsGeneralPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <ContentHero
          title="Words for General English"
          description="Vocabulary builder for everyday English."
          icon={BookOpen}
          accent="from-amber-500 to-orange-500"
        />
        <WordListsList category="general" />
      </div>
    </div>
  );
}
