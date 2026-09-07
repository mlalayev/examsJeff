"use client";

import type { ExamCategory } from "./types";
import { EXAM_CATEGORY_LABELS } from "@/lib/exam-category-utils";

interface CategorySelectorProps {
  categories: ExamCategory[];
  onSelect: (category: ExamCategory) => void;
}

const CATEGORY_BLURB: Record<ExamCategory, string> = {
  IELTS: "International English Language Testing System",
  GENERAL_ENGLISH: "Unit-based exams",
  TOEFL: "Test of English as a Foreign Language",
  SAT: "Scholastic Assessment Test",
  MATH: "Mathematics exams",
  KIDS: "Kids exams",
  PLACEMENT: "Determine a student's English level (A1–B2)",
};

export default function CategorySelector({ categories, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className="p-4 sm:p-6 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition text-left"
        >
          <div className="font-medium text-gray-900 mb-1">
            {EXAM_CATEGORY_LABELS[category] ?? category}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {CATEGORY_BLURB[category]}
          </div>
        </button>
      ))}
    </div>
  );
}
