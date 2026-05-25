"use client";

import useSWR from "swr";
import { Library, GraduationCap } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";
import type { WordListItem } from "@/lib/student-content";

type Response = { items: WordListItem[]; nextCursor: string | null };

export default function WordListsList({ category }: { category: string }) {
  const { data, error, isLoading } = useSWR<Response>(
    `/api/student/words?category=${encodeURIComponent(category)}`,
    swrConfig.fetcher,
    swrConfig
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Failed to load word lists. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Library className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">No word lists yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Vocabulary decks will appear here once they are published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((l) => {
        const pct =
          l.totalWords > 0 ? Math.round((l.mastered / l.totalWords) * 100) : 0;
        return (
          <div
            key={l.id}
            className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                  {l.title}
                </h3>
                {l.level ? (
                  <p className="text-[11px] text-slate-500 font-medium">
                    {l.level}
                  </p>
                ) : null}
              </div>
            </div>
            {l.description ? (
              <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                {l.description}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span>{l.totalWords} words</span>
              <span className="font-medium text-slate-700">{pct}% mastered</span>
            </div>
            <div className="mt-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
