"use client";

export type ToggleChipOption = {
  id: string;
  label: string;
  /** Optional accent color for the active state + dot. Defaults to brand. */
  accent?: string;
};

const BRAND = "#303380";

export default function ToggleChips({
  options,
  selected,
  onToggle,
}: {
  options: ToggleChipOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.id);
        const accent = o.accent ?? BRAND;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "border-transparent text-white"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
            style={active ? { backgroundColor: accent } : {}}
          >
            {!active && o.accent && (
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: o.accent }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
