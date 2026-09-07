"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import CollapsibleNavSection from "./CollapsibleNavSection";
import { getActiveSubHref } from "./navUtils";
import {
  getStaffDashboardHref,
  getStaffNavSections,
  staffNavUsesExactMatch,
} from "./staffNavConfig";

type Props = {
  role: string;
  onNavigate?: () => void;
};

const ACTIVE_BG = "#303380";
const ACTIVE_BG_HOVER = "#252a6b";

export default function StaffNav({ role, onNavigate }: Props) {
  const pathname = usePathname();
  const sections = getStaffNavSections(role);
  const exactMatch = staffNavUsesExactMatch(role);
  const dashboardHref = getStaffDashboardHref(role);
  const dashboardActive = Boolean(dashboardHref && pathname === dashboardHref);

  const activeId =
    sections.find((sec) => getActiveSubHref(pathname, sec.subs, exactMatch) !== null)
      ?.id ?? null;

  const [openId, setOpenId] = useState<string | null>(activeId);

  useEffect(() => {
    if (activeId) setOpenId(activeId);
  }, [activeId]);

  return (
    <div className="space-y-1">
      {dashboardHref ? (
        <Link
          href={dashboardHref}
          prefetch={false}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
            dashboardActive
              ? "text-white"
              : "text-slate-700 hover:bg-slate-50"
          }`}
          style={dashboardActive ? { backgroundColor: ACTIVE_BG } : {}}
          onMouseEnter={(e) => {
            if (dashboardActive) {
              e.currentTarget.style.backgroundColor = ACTIVE_BG_HOVER;
            }
          }}
          onMouseLeave={(e) => {
            if (dashboardActive) {
              e.currentTarget.style.backgroundColor = ACTIVE_BG;
            }
          }}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium">Dashboard</span>
        </Link>
      ) : null}

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
