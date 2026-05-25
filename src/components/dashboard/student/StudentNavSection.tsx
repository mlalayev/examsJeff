"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { StudentNavSectionItem } from "./studentNavConfig";

type Props = {
  section: StudentNavSectionItem;
  onNavigate?: () => void;
};

const ACTIVE_BG = "#303380";
const ACTIVE_BG_HOVER = "#252a6b";

export default function StudentNavSection({ section, onNavigate }: Props) {
  const pathname = usePathname();
  const { label, icon: Icon, color, subs } = section;

  const activeSub = subs.find(
    (s) => pathname === s.href || pathname.startsWith(s.href + "/")
  );
  const hasActive = Boolean(activeSub);

  const [open, setOpen] = useState<boolean>(hasActive);

  // Auto-open when a child route becomes active (e.g. via direct nav)
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`group w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-colors ${
          hasActive ? "bg-slate-50" : "hover:bg-slate-50"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm shadow-slate-200`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span
          className={`text-sm font-semibold flex-1 text-left ${
            hasActive ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {label}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Smooth collapsible region using CSS grid rows trick (no JS height math) */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
            {subs.map((sub) => {
              const isActive =
                pathname === sub.href || pathname.startsWith(sub.href + "/");
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  style={isActive ? { backgroundColor: ACTIVE_BG } : {}}
                  onMouseEnter={(e) => {
                    if (isActive) {
                      e.currentTarget.style.backgroundColor = ACTIVE_BG_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isActive) {
                      e.currentTarget.style.backgroundColor = ACTIVE_BG;
                    }
                  }}
                >
                  <SubIcon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{sub.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
