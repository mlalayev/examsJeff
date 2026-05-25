"use client";

import useSWR from "swr";
import { BookOpen, CheckCircle2, PlayCircle, Timer } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";
import type { LessonListItem } from "@/lib/student-content";

type Response = { items: LessonListItem[]; nextCursor: string | null };

const statusLabel: Record<LessonListItem["status"], string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const statusBadge: Record<LessonListItem["status"], string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function LessonsList({ category }: { category: string }) {
  const { data, error, isLoading } = useSWR<Response>(
    `/api/student/lessons?category=${encodeURIComponent(category)}`,
    swrConfig.fetcher,
    swrConfig
  );

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
        Failed to load lessons. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">No lessons yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Lessons for this track will appear here once your teacher publishes
          them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((l) => {
        const StatusIcon =
          l.status === "COMPLETED"
            ? CheckCircle2
            : l.status === "IN_PROGRESS"
              ? PlayCircle
              : BookOpen;
        return (
          <div
            key={l.id}
            className="group rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition overflow-hidden flex flex-col"
          >
            {l.coverImage ? (
              <img
                src={l.coverImage}
                alt=""
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-sky-100 to-blue-100" />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadge[l.status]}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusLabel[l.status]}
                </span>
                {l.level ? (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {l.level}
                  </span>
                ) : null}
                {l.durationMin ? (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Timer className="w-3 h-3" />
                    {l.durationMin}m
                  </span>
                ) : null}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                {l.title}
              </h3>
              {l.summary ? (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                  {l.summary}
                </p>
              ) : null}
              {l.progressPct > 0 ? (
                <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                    style={{ width: `${Math.min(100, l.progressPct)}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
