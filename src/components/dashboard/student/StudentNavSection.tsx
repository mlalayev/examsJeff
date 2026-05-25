"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { StudentNavSectionItem } from "./studentNavConfig";

type Props = {
  section: StudentNavSectionItem;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
};

const ACTIVE_BG = "#303380";
const ACTIVE_BG_HOVER = "#252a6b";

export default function StudentNavSection({
  section,
  isOpen,
  onToggle,
  onNavigate,
}: Props) {
  const pathname = usePathname();
  const { label, icon: Icon, subs } = section;

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-3 py-2 rounded text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Icon className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium flex-1 text-left">{label}</span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-0.5 ml-3 pl-3 border-l border-slate-200 space-y-0.5">
            {subs.map((sub) => {
              const isActive =
                pathname === sub.href || pathname.startsWith(sub.href + "/");
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  prefetch={false}
                  onClick={onNavigate}
                  className={`flex items-center px-3 py-1.5 rounded text-sm transition-colors ${
                    isActive
                      ? "text-white"
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
