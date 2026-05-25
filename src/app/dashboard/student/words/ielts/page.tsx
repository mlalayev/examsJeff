import PageHeader from "@/components/dashboard/student/PageHeader";
import WordListsList from "@/components/dashboard/student/WordListsList";

export const dynamic = "force-dynamic";

export default function WordsIeltsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Words for IELTS"
        description="Target vocabulary to ace the IELTS."
      />
      <WordListsList category="ielts" />
    </div>
  );
}
