"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentNavSection from "./StudentNavSection";
import { getActiveSubHref, studentNavSections } from "./studentNavConfig";
import { isSundayExaminer } from "@/lib/sunday-examiner";

type Props = {
  onNavigate?: () => void;
};

export default function StudentNav({ onNavigate }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tags = (session?.user as { tags?: string[] } | undefined)?.tags;
  const examOnly = isSundayExaminer(tags);

  const sections = useMemo(
    () =>
      examOnly
        ? studentNavSections.filter((section) => section.id === "exam")
        : studentNavSections,
    [examOnly]
  );

  const activeId =
    sections.find((sec) => getActiveSubHref(pathname, sec.subs) !== null)?.id ??
    null;

  const [openId, setOpenId] = useState<string | null>(activeId);

  // Whenever the route changes, open the section that contains the active route.
  useEffect(() => {
    if (activeId) setOpenId(activeId);
  }, [activeId]);

  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <StudentNavSection
          key={section.id}
          section={section}
          isOpen={openId === section.id}
          onToggle={() =>
            setOpenId((cur) => (cur === section.id ? null : section.id))
          }
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
