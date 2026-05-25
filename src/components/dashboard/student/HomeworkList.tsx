"use client";

import useSWR from "swr";
import Link from "next/link";
import {
  ClipboardList,
  Calendar,
  GraduationCap,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { swrConfig } from "@/lib/swr-config";

type HomeworkItem = {
  id: string;
  status: string;
  startAt: string | null;
  dueAt: string | null;
  createdAt: string;
  isExtra: boolean;
  exam: {
    id: string;
    title: string;
    category: string;
    track: string | null;
    durationMin: number | null;
  };
  unit: { id: string; title: string; order: number } | null;
  teacher: { id: string; name: string | null } | null;
  attempt: { id: string; status: string; bandOverall: number | null } | null;
};

type Response = { items: HomeworkItem[] };

function formatDate(d: string | null): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function HomeworkList({
  type,
}: {
  type: "regular" | "extras";
}) {
  const { data, error, isLoading } = useSWR<Response>(
    `/api/student/homework?type=${type}`,
    swrConfig.fetcher,
    swrConfig
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white border border-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        Failed to load homework. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <ClipboardList className="w-6 h-6 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          {type === "extras" ? "No extras yet" : "No homework assigned"}
        </h2>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          {type === "extras"
            ? "Bonus practice activities will show up here when assigned."
            : "When your teacher assigns homework, it will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const done = a.attempt?.status === "SUBMITTED";
        const due = formatDate(a.dueAt);
        return (
          <div
            key={a.id}
            className="rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition px-4 py-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${
                done
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-emerald-400 to-teal-500"
              }`}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <ClipboardList className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {a.exam.title}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                  {a.exam.category}
                </span>
                {a.unit ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                    Unit {a.unit.order}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {a.teacher?.name ? (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {a.teacher.name}
                  </span>
                ) : null}
                {due ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due {due}
                  </span>
                ) : null}
                {a.exam.durationMin ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {a.exam.durationMin} min
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {done && a.attempt?.bandOverall !== null && a.attempt?.bandOverall !== undefined ? (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                  Band {a.attempt.bandOverall}
                </span>
              ) : null}
              <Link
                href={
                  a.attempt?.id
                    ? `/dashboard/student/results/${a.attempt.id}`
                    : `/dashboard/student/exams`
                }
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                {done ? "View result" : "Open"}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
