"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Search, UserPlus, Pencil } from "lucide-react";
import { swrConfig } from "@/lib/swr-config";
import AssignHomeworkModal from "@/components/dashboard/homework/AssignHomeworkModal";
import {
  getHomeworkDashboardBase,
  type HomeworkDashboardRole,
} from "@/lib/homework-dashboard";

import {
  getHomeworkSubjectLabel,
  formatHomeworkLevel,
} from "@/lib/homework-subjects";

type TemplateItem = {
  id: string;
  title: string;
  category: string;
  track: string | null;
  homeworkSubject: string | null;
  isActive: boolean;
  durationMin: number | null;
  createdAt: string;
  sectionCount: number;
  assignmentCount: number;
  createdBy: { id: string; name: string | null } | null;
  canEdit?: boolean;
};

type Response = { items: TemplateItem[] };

type Props = {
  role: HomeworkDashboardRole;
};

export default function HomeworkTemplatesList({ role }: Props) {
  const base = getHomeworkDashboardBase(role);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [assignTarget, setAssignTarget] = useState<TemplateItem | null>(null);

  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const { data, error, isLoading, mutate } = useSWR<Response>(
    `/api/admin/homework/templates${query}`,
    swrConfig.fetcher,
    swrConfig
  );

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href={`${base}/create`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: "#303380" }}
        >
          <Plus className="w-4 h-4" />
          Create Homework
        </Link>

        <form
          className="flex-1 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search homework..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Search
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-md p-6 text-sm text-gray-500">
          Loading homework templates...
        </div>
      ) : error ? (
        <div className="bg-white border border-gray-200 rounded-md p-6 text-sm text-gray-600">
          Failed to load homework templates.
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md px-4 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No homework yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create homework with the same question types used in exams.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Lesson</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Sections</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Assigned</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {getHomeworkSubjectLabel(item.homeworkSubject)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatHomeworkLevel(item.homeworkSubject, item.track) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.sectionCount}</td>
                    <td className="px-4 py-3 text-gray-600">{item.assignmentCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.canEdit !== false ? (
                          <Link
                            href={`${base}/${item.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setAssignTarget(item)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded"
                          style={{ color: "#303380" }}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Assign
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {assignTarget ? (
        <AssignHomeworkModal
          role={role}
          examId={assignTarget.id}
          examTitle={assignTarget.title}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => {
            setAssignTarget(null);
            mutate();
          }}
        />
      ) : null}
    </div>
  );
}
