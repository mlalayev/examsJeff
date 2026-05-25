"use client";

import useSWR from "swr";
import { Clock } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";
import type { LessonListItem } from "@/lib/student-content";

type Response = { items: LessonListItem[]; nextCursor: string | null };

const statusLabel: Record<LessonListItem["status"], string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export default function LessonsList({ category }: { category: string }) {
  const { data, error, isLoading } = useSWR<Response>(
    `/api/student/lessons?category=${encodeURIComponent(category)}`,
    swrConfig.fetcher,
    swrConfig
  );

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
        Failed to load lessons. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">No lessons yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Lessons for this track will appear here once they are published.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Lesson
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Level
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Duration
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{l.title}</div>
                  {l.summary ? (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {l.summary}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-600">{l.level ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {l.durationMin ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {l.durationMin} min
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{statusLabel[l.status]}</span>
                    {l.progressPct > 0 ? (
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(100, l.progressPct)}%`,
                            backgroundColor: "#303380",
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
