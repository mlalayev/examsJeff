import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  accent?: string;
};

export default function ContentHero({
  title,
  description,
  icon: Icon,
  accent = "from-violet-500 to-indigo-600",
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${accent} opacity-90`} />
      <div className="relative px-6 sm:px-10 pt-12 pb-8">
        <div className="flex items-start gap-4">
          {Icon ? (
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-lg ring-4 ring-white`}
            >
              <Icon className="w-7 h-7" />
            </div>
          ) : null}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm sm:text-base text-slate-600 max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
