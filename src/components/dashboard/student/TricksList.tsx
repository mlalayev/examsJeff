"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState } from "react";
import { Bookmark, BookmarkCheck, Video } from "lucide-react";
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
      <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-4 flex items-center gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-1/5 animate-pulse ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-6 text-sm text-gray-600">
        Failed to load tricks. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">No tricks yet</p>
        <p className="mt-1 text-sm text-gray-500">
          New tips and shortcuts will appear here as they are added.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
      {items.map((t) => (
        <div
          key={t.id}
          className="px-4 py-4 flex items-start gap-4 hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {t.title}
              </h3>
              {t.videoUrl ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                  <Video className="w-3 h-3" />
                  Video
                </span>
              ) : null}
            </div>
            {t.summary ? (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                {t.summary}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={pending === t.id}
            onClick={() => toggleSave(t)}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition ${
              t.saved
                ? "border-gray-300 bg-gray-50 text-gray-900"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
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
      ))}
    </div>
  );
}
