"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import StudentNavSection from "./StudentNavSection";
import { getActiveSubHref, studentNavSections } from "./studentNavConfig";

type Props = {
  onNavigate?: () => void;
};

export default function StudentNav({ onNavigate }: Props) {
  const pathname = usePathname();

  const activeId =
    studentNavSections.find(
      (sec) => getActiveSubHref(pathname, sec.subs) !== null
    )?.id ?? null;

  const [openId, setOpenId] = useState<string | null>(activeId);

  // Whenever the route changes, open the section that contains the active route.
  useEffect(() => {
    if (activeId) setOpenId(activeId);
  }, [activeId]);

  return (
    <div className="space-y-1">
      {studentNavSections.map((section) => (
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
