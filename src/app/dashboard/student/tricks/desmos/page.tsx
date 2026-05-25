import { Calculator } from "lucide-react";
import ContentHero from "@/components/dashboard/student/ContentHero";
import TricksList from "@/components/dashboard/student/TricksList";

export const dynamic = "force-dynamic";

export default function DesmosTricksPage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <ContentHero
          title="Desmos Tricks"
          description="Speed up your SAT math with Desmos shortcuts."
          icon={Calculator}
          accent="from-pink-500 to-rose-600"
        />
        <TricksList category="desmos" />
      </div>
    </div>
  );
}
