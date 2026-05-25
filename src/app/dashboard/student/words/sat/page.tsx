import PageHeader from "@/components/dashboard/student/PageHeader";
import WordListsList from "@/components/dashboard/student/WordListsList";

export const dynamic = "force-dynamic";

export default function WordsSatPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Words for SAT"
        description="High-yield SAT vocabulary practice."
      />
      <WordListsList category="sat" />
    </div>
  );
}
