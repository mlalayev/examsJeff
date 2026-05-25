import PageHeader from "@/components/dashboard/student/PageHeader";
import TricksList from "@/components/dashboard/student/TricksList";

export const dynamic = "force-dynamic";

export default function WritingTricksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Writing Tricks"
        description="Tips, templates and tricks to power up your writing."
      />
      <TricksList category="writing" />
    </div>
  );
}
