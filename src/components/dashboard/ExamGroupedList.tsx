"use client";

import type { ReactNode } from "react";
import { BookOpen } from "lucide-react";
import {
  EXAM_CATEGORY_GROUPS,
  getExamCategoryLabel,
} from "@/lib/exam-category-utils";

export type ExamListItem = {
  id: string;
  title: string;
  category: string;
  track: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    sections: number;
    questions: number;
  };
};

export default function ExamGroupedList({
  exams,
  renderActions,
}: {
  exams: ExamListItem[];
  renderActions: (exam: ExamListItem) => ReactNode;
}) {
  const grouped = EXAM_CATEGORY_GROUPS.map((group) => {
    const byCategory = group.categories
      .map((category) => ({
        category,
        exams: exams.filter((e) => e.category === category),
      }))
      .filter((entry) => entry.exams.length > 0);

    return {
      ...group,
      byCategory,
    };
  }).filter((g) => g.byCategory.length > 0);

  const known = new Set(
    EXAM_CATEGORY_GROUPS.flatMap((g) => g.categories as string[])
  );
  const unknown = exams.filter((e) => !known.has(e.category));

  if (exams.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-white py-12 text-center text-gray-500">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p>No exams found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <section
          key={group.id}
          className="overflow-hidden rounded-md border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
            <p className="text-xs text-gray-500">{group.description}</p>
          </div>

          {group.byCategory.map(({ category, exams: catExams }) => (
            <div key={category} className="border-b border-gray-100 last:border-b-0">
              <div className="flex items-center justify-between bg-white px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {getExamCategoryLabel(category)}
                </h3>
                <span className="text-xs text-gray-400">
                  {catExams.length} exam{catExams.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="border-y border-gray-100 bg-gray-50/80">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 sm:px-4">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 sm:px-4">
                        Sections
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 sm:px-4">
                        Questions
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 sm:px-4">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 sm:px-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {catExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm sm:px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100">
                              <BookOpen className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {exam.title}
                              </div>
                              {exam.track && (
                                <div className="text-xs text-gray-500">
                                  {exam.track}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 sm:px-4">
                          {exam._count.sections}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 sm:px-4">
                          {exam._count.questions}
                        </td>
                        <td className="px-3 py-3 text-sm sm:px-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              exam.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {exam.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm sm:px-4">
                          {renderActions(exam)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ))}

      {unknown.length > 0 && (
        <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Uncategorized</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <tbody className="divide-y divide-gray-100">
                {unknown.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{exam.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {getExamCategoryLabel(exam.category)}
                    </td>
                    <td className="px-4 py-3 text-sm">{renderActions(exam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
