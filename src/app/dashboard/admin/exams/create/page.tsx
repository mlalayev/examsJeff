"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CategorySelector from "@/components/admin/exams/create/CategorySelector";
import type { ExamCategory } from "@/components/admin/exams/create/types";
import { categoryToSlug } from "@/lib/exam-category-utils";

export default function CreateExamLandingPage() {
  const router = useRouter();

  const categories: ExamCategory[] = ["IELTS", "TOEFL", "SAT", "GENERAL_ENGLISH", "MATH", "KIDS"];

  const handleCategorySelect = (category: ExamCategory) => {
    const slug = categoryToSlug(category);
    router.push(`/dashboard/admin/exams/create/${slug}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Create New Exam</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Select the exam category</p>
      </div>

      <CategorySelector categories={categories} onSelect={handleCategorySelect} />
    </div>
  );
}
