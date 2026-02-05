"use client";

import type { ExamCategory } from "./types";

interface CategorySelectorProps {
  categories: ExamCategory[];
  onSelect: (category: ExamCategory) => void;
}

export default function CategorySelector({ categories, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className="p-4 sm:p-6 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition text-left"
        >
          <div className="font-medium text-gray-900 mb-1">{category}</div>
          <div className="text-xs sm:text-sm text-gray-500">
            {category === "GENERAL_ENGLISH" && "Unit-based exams"}
            {category === "TOEFL" && "Test of English as a Foreign Language"}
            {category === "SAT" && "Scholastic Assessment Test"}
            {category === "MATH" && "Mathematics exams"}
            {category === "KIDS" && "Kids exams"}
          </div>
        </button>
      ))}
    </div>
  );
}

