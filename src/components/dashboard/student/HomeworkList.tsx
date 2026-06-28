"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { swrConfig } from "@/lib/swr-config";
import { attemptRunnerPath } from "@/lib/attempt-runner-path";

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
  } | null;
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
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const { data, error, isLoading, mutate } = useSWR<Response>(
    `/api/student/homework?type=${type}`,
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
        Failed to load homework. Try refreshing the page.
      </div>
    );
  }

  const items = data?.items ?? [];

  const openHomework = async (item: HomeworkItem) => {
    if (!item.exam) return;
    if (item.attempt?.id) {
      router.push(attemptRunnerPath(item.attempt.id, item.exam.category));
      return;
    }

    setStartingId(item.id);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: item.id }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (payload.attempt?.id) {
          router.push(attemptRunnerPath(payload.attempt.id, item.exam.category));
          return;
        }
        throw new Error(payload.error || "Failed to start homework");
      }
      await mutate();
      router.push(attemptRunnerPath(payload.attempt.id, item.exam.category));
    } catch {
      // keep UI simple — user can retry
    } finally {
      setStartingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">
          {type === "extras" ? "No extras yet" : "No homework assigned"}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {type === "extras"
            ? "Bonus practice activities will show up here when assigned."
            : "When your teacher assigns homework, it will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Exam
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Category
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Teacher
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Due
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((a) => {
              const done = a.attempt?.status === "SUBMITTED";
              const due = formatDate(a.dueAt);
              const hasExam = Boolean(a.exam?.id);
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {a.exam?.title ?? "—"}
                      </div>
                    {a.unit ? (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Unit {a.unit.order} · {a.unit.title}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.exam?.category ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.teacher?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{due ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {done ? (
                      <span className="text-xs">
                        Submitted
                        {a.attempt?.bandOverall !== null &&
                        a.attempt?.bandOverall !== undefined
                          ? ` · Band ${a.attempt.bandOverall}`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-xs">{a.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {done ? (
                      <Link
                        href={`/dashboard/student/results/${a.attempt?.id}`}
                        className="text-xs font-medium text-gray-900 hover:underline"
                      >
                        View result
                      </Link>
                    ) : hasExam ? (
                      <button
                        type="button"
                        disabled={startingId === a.id}
                        onClick={() => openHomework(a)}
                        className="text-xs font-medium text-gray-900 hover:underline disabled:opacity-50"
                      >
                        {startingId === a.id
                          ? "Starting..."
                          : a.attempt?.id
                            ? "Continue"
                            : "Open"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
