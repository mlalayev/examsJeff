"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Construction, type LucideIcon } from "lucide-react";
import { getActiveSubHref, type CollapsibleSubItem } from "./navUtils";

export type CollapsibleNavSectionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  subs: CollapsibleSubItem[];
  maintenance?: boolean;
};

type Props = {
  section: CollapsibleNavSectionItem;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  exactMatch?: boolean;
};

const ACTIVE_BG = "#303380";
const ACTIVE_BG_HOVER = "#252a6b";

function SubLink({
  item,
  isActive,
  onNavigate,
}: {
  item: CollapsibleSubItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  if (!item.href) return null;

  if (item.disabled || item.comingSoon) {
    return (
      <div
        className="flex items-center px-3 py-1.5 rounded text-sm text-slate-400 cursor-not-allowed"
        title={item.comingSoon ? "Coming soon" : "Unavailable"}
      >
        <span className="truncate flex-1">{item.label}</span>
        {item.comingSoon ? (
          <span className="text-xs text-slate-400 ml-2">Soon</span>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
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
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NestedGroup({
  item,
  exactMatch,
  onNavigate,
}: {
  item: CollapsibleSubItem;
  exactMatch: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const children = item.children ?? [];
  const activeHref = getActiveSubHref(pathname, children, exactMatch);
  const childActive = activeHref !== null;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((cur) => !cur)}
        aria-expanded={open}
        className="w-full flex items-center px-3 py-1.5 rounded text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
      >
        <span className="truncate flex-1 text-left">{item.label}</span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-0.5 ml-2 pl-2 border-l border-slate-200 space-y-0.5">
            {children.map((child) => (
              <NavItem
                key={child.href ?? child.label}
                item={child}
                exactMatch={exactMatch}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  item,
  exactMatch,
  onNavigate,
}: {
  item: CollapsibleSubItem;
  exactMatch: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (item.children?.length) {
    return (
      <NestedGroup
        item={item}
        exactMatch={exactMatch}
        onNavigate={onNavigate}
      />
    );
  }

  const activeHref = getActiveSubHref(pathname, [item], exactMatch);
  return (
    <SubLink
      item={item}
      isActive={item.href === activeHref}
      onNavigate={onNavigate}
    />
  );
}

export default function CollapsibleNavSection({
  section,
  isOpen,
  onToggle,
  onNavigate,
  exactMatch = false,
}: Props) {
  const pathname = usePathname();
  const { label, icon: Icon, subs, maintenance } = section;
  const activeHref = getActiveSubHref(pathname, subs, exactMatch);
  const sectionActive = !maintenance && activeHref !== null;

  if (maintenance) {
    return (
      <div className="select-none">
        <div
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-slate-400 cursor-not-allowed"
          title="Maintenance"
        >
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium flex-1 text-left">{label}</span>
          <Construction className="w-4 h-4 text-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
          sectionActive && !isOpen
            ? "text-white"
            : "text-slate-700 hover:bg-slate-50"
        }`}
        style={sectionActive && !isOpen ? { backgroundColor: ACTIVE_BG } : {}}
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
            {subs.map((sub) => (
              <NavItem
                key={sub.href ?? sub.label}
                item={sub}
                exactMatch={exactMatch}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
