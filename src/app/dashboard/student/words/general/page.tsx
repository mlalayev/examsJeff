import PageHeader from "@/components/dashboard/student/PageHeader";
import WordListsList from "@/components/dashboard/student/WordListsList";

export const dynamic = "force-dynamic";

export default function WordsGeneralPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Words for General English"
        description="Vocabulary builder for everyday English."
      />
      <WordListsList category="general" />
    </div>
  );
}
