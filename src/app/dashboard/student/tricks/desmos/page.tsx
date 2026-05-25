import PageHeader from "@/components/dashboard/student/PageHeader";
import TricksList from "@/components/dashboard/student/TricksList";

export const dynamic = "force-dynamic";

export default function DesmosTricksPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Desmos Tricks"
        description="Speed up your SAT math with Desmos shortcuts."
      />
      <TricksList category="desmos" />
    </div>
  );
}
