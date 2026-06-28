"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CategorySelector from "@/components/admin/exams/create/CategorySelector";
import type { ExamCategory } from "@/components/admin/exams/create/types";
import { categoryToSlug } from "@/lib/exam-category-utils";
import {
  getHomeworkDashboardBase,
  HOMEWORK_CREATE_CATEGORIES,
  type HomeworkDashboardRole,
} from "@/lib/homework-dashboard";

type Props = {
  role: HomeworkDashboardRole;
};

export default function HomeworkCreateLanding({ role }: Props) {
  const router = useRouter();
  const base = getHomeworkDashboardBase(role);

  const handleCategorySelect = (category: ExamCategory) => {
    const slug = categoryToSlug(category);
    router.push(`${base}/create/${slug}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.push(base)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Homework
        </button>
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
          Create Homework
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Select a category — question types work the same as exam creation
        </p>
      </div>

      <CategorySelector
        categories={[...HOMEWORK_CREATE_CATEGORIES]}
        onSelect={handleCategorySelect}
      />
    </div>
  );
}
