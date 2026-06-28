"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getHomeworkDashboardBase,
  type HomeworkDashboardRole,
} from "@/lib/homework-dashboard";
import {
  HOMEWORK_SUBJECTS,
  ENGLISH_LEVELS,
  homeworkSubjectToCategory,
  isEnglishSubject,
} from "@/lib/homework-subjects";
import { categoryToSlug } from "@/lib/exam-category-utils";

type Props = {
  role: HomeworkDashboardRole;
};

export default function HomeworkCreateLanding({ role }: Props) {
  const router = useRouter();
  const base = getHomeworkDashboardBase(role);
  const [subject, setSubject] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    setError("");
    if (!subject) {
      setError("Select which lesson this homework is for.");
      return;
    }
    const category = homeworkSubjectToCategory(subject);
    if (!category) {
      setError("Invalid lesson selection.");
      return;
    }
    if (isEnglishSubject(subject) && !level) {
      setError("Select an English level (A1–B2).");
      return;
    }

    const slug = categoryToSlug(category);
    const params = new URLSearchParams({ subject });
    if (level) params.set("level", level);
    router.push(`${base}/create/${slug}?${params.toString()}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
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
          Choose the lesson, then add questions the same way as exams
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Which lesson is this homework for?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HOMEWORK_SUBJECTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSubject(s.id);
                  if (!isEnglishSubject(s.id)) setLevel("");
                }}
                className={`px-3 py-2.5 text-sm font-medium rounded-md border transition ${
                  subject === s.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isEnglishSubject(subject) ? (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              English level
            </label>
            <div className="flex flex-wrap gap-2">
              {ENGLISH_LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border transition ${
                    level === l.id
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!subject}
          className="px-5 py-2.5 text-sm font-medium text-white rounded-md disabled:opacity-40"
          style={{ backgroundColor: "#303380" }}
        >
          Continue to questions
        </button>
      </div>
    </div>
  );
}
