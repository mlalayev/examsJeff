import { Globe } from "lucide-react";
import ContentHero from "@/components/dashboard/student/ContentHero";
import WordListsList from "@/components/dashboard/student/WordListsList";

export const dynamic = "force-dynamic";

export default function WordsIeltsPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <ContentHero
          title="Words for IELTS"
          description="Target vocabulary to ace the IELTS."
          icon={Globe}
          accent="from-amber-500 to-orange-500"
        />
        <WordListsList category="ielts" />
      </div>
    </div>
  );
}
