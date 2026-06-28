"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";

type HomeworkItem = {
  id: string;
  status: string;
  startAt: string | null;
  dueAt: string | null;
  createdAt: string;
  isExtra: boolean;
  student: { id: string; name: string | null; email: string };
  teacher: { id: string; name: string | null } | null;
  class: { id: string; name: string } | null;
  exam: {
    id: string;
    title: string;
    category: string;
    track: string | null;
    durationMin: number | null;
  };
  unit: { id: string; title: string; order: number } | null;
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

type Props = {
  apiBase: "/api/admin/homework" | "/api/teacher/homework";
  showTeacherColumn?: boolean;
};

export default function HomeworkManagementList({
  apiBase,
  showTeacherColumn = true,
}: Props) {
  const [type, setType] = useState<"regular" | "extras">("regular");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const query = new URLSearchParams({ type });
  if (search) query.set("search", search);

  const { data, error, isLoading } = useSWR<Response>(
    `${apiBase}?${query.toString()}`,
    swrConfig.fetcher,
    swrConfig
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setType("regular")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition ${
              type === "regular"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Homeworks
          </button>
          <button
            type="button"
            onClick={() => setType("extras")}
            className={`px-3 py-1.5 text-sm font-medium rounded transition ${
              type === "extras"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Extras
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search student or exam..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-3 bg-gray-100 rounded w-1/5 animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-gray-200 rounded-md px-4 py-6 text-sm text-gray-600">
          Failed to load homework. Try refreshing the page.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">
            {type === "extras" ? "No extras assigned" : "No homework assigned"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {search
              ? "No results match your search."
              : type === "extras"
                ? "Bonus practice assignments will appear here."
                : "Unit exam homework assignments will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Student
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Exam
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Class
                  </th>
                  {showTeacherColumn ? (
                    <th className="text-left px-4 py-3 font-medium text-gray-700">
                      Teacher
                    </th>
                  ) : null}
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Due
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((a) => {
                  const done = a.attempt?.status === "SUBMITTED";
                  const due = formatDate(a.dueAt);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {a.student.name ?? a.student.email}
                        </div>
                        {a.student.name ? (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {a.student.email}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {a.exam.title}
                        </div>
                        {a.unit ? (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Unit {a.unit.order} · {a.unit.title}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {a.class?.name ?? "—"}
                      </td>
                      {showTeacherColumn ? (
                        <td className="px-4 py-3 text-gray-600">
                          {a.teacher?.name ?? "—"}
                        </td>
                      ) : null}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
