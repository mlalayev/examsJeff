"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import CollapsibleNavSection from "./CollapsibleNavSection";
import { getActiveSubHref } from "./navUtils";
import {
  getStaffNavSections,
  staffNavUsesExactMatch,
} from "./staffNavConfig";

type Props = {
  role: string;
  onNavigate?: () => void;
};

export default function StaffNav({ role, onNavigate }: Props) {
  const pathname = usePathname();
  const sections = getStaffNavSections(role);
  const exactMatch = staffNavUsesExactMatch(role);

  const activeId =
    sections.find((sec) => getActiveSubHref(pathname, sec.subs, exactMatch) !== null)
      ?.id ?? null;

  const [openId, setOpenId] = useState<string | null>(activeId);

  useEffect(() => {
    if (activeId) setOpenId(activeId);
  }, [activeId]);

  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <CollapsibleNavSection
          key={section.id}
          section={section}
          isOpen={openId === section.id}
          onToggle={() =>
            setOpenId((cur) => (cur === section.id ? null : section.id))
          }
          onNavigate={onNavigate}
          exactMatch={exactMatch}
        />
      ))}
    </div>
  );
}
