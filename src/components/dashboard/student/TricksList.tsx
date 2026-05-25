"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState } from "react";
import { Sparkles, Bookmark, BookmarkCheck, Video } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";
import type { TrickListItem } from "@/lib/student-content";

type Response = { items: TrickListItem[]; nextCursor: string | null };

export default function TricksList({ category }: { category: string }) {
  const url = `/api/student/tricks?category=${encodeURIComponent(category)}`;
  const { data, error, isLoading } = useSWR<Response>(
    url,
    swrConfig.fetcher,
    swrConfig
  );
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState<string | null>(null);

  async function toggleSave(t: TrickListItem) {
    setPending(t.id);
    try {
      await fetch(`/api/student/tricks/${t.id}/save`, {
        method: t.saved ? "DELETE" : "POST",
      });
      await mutate(url);
    } finally {
      setPending(null);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-xl bg-white border border-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Failed to load tricks. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">No tricks yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          New tips and shortcuts will appear here as they are added.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition overflow-hidden flex flex-col"
        >
          {t.coverImage ? (
            <img src={t.coverImage} alt="" className="h-32 w-full object-cover" />
          ) : (
            <div className="h-32 w-full bg-gradient-to-br from-pink-100 to-rose-100" />
          )}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              {t.videoUrl ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[11px] font-medium">
                  <Video className="w-3 h-3" />
                  Video
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                disabled={pending === t.id}
                onClick={() => toggleSave(t)}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition ${
                  t.saved
                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.saved ? (
                  <BookmarkCheck className="w-3.5 h-3.5" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {t.saved ? "Saved" : "Save"}
              </button>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
              {t.title}
            </h3>
            {t.summary ? (
              <p className="mt-1 text-xs text-slate-500 line-clamp-3">
                {t.summary}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
