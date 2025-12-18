"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { SAT_STRUCTURE, validateSATModule } from "@/lib/sat-template";

type ModuleQuestionCounts = {
  mathModule1: number;
  mathModule2: number;
  verbalModule1: number;
  verbalModule2: number;
};

export default function CreateSATExamPage() {
  const router = useRouter();
  const [examTitle, setExamTitle] = useState("");
  const [questionCounts, setQuestionCounts] = useState<ModuleQuestionCounts>({
    mathModule1: 22,
    mathModule2: 22,
    verbalModule1: 27,
    verbalModule2: 27,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCounts = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Math Module 1
    const mathMod1Validation = validateSATModule("Math Module 1", questionCounts.mathModule1);
    if (!mathMod1Validation.valid) {
      newErrors.mathModule1 = mathMod1Validation.error || "";
    }

    // Validate Math Module 2
    const mathMod2Validation = validateSATModule("Math Module 2", questionCounts.mathModule2);
    if (!mathMod2Validation.valid) {
      newErrors.mathModule2 = mathMod2Validation.error || "";
    }

    // Validate Verbal Module 1
    const verbalMod1Validation = validateSATModule("Verbal Module 1", questionCounts.verbalModule1);
    if (!verbalMod1Validation.valid) {
      newErrors.verbalModule1 = verbalMod1Validation.error || "";
    }

    // Validate Verbal Module 2
    const verbalMod2Validation = validateSATModule("Verbal Module 2", questionCounts.verbalModule2);
    if (!verbalMod2Validation.valid) {
      newErrors.verbalModule2 = verbalMod2Validation.error || "";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim()) {
      alert("Please enter an exam title");
      return;
    }

    if (!validateCounts()) {
      alert("Please fix the validation errors before creating the exam");
      return;
    }

    setSaving(true);

    try {
      // Create exam with SAT structure
      // Order: Verbal 1, Verbal 2, Math 1, Math 2
      const sections = [
        {
          type: "READING", // Verbal Module 1
          title: SAT_STRUCTURE.VERBAL.modules[0].name,
          instruction: JSON.stringify({
            text: "Complete all questions in this module. You have 32 minutes.",
          }),
          durationMin: SAT_STRUCTURE.VERBAL.modules[0].duration,
          order: SAT_STRUCTURE.VERBAL.modules[0].order,
          questions: Array.from({ length: questionCounts.verbalModule1 }, (_, i) => ({
            qtype: "MCQ_SINGLE",
            order: i,
            prompt: { text: `Question ${i + 1}` },
            options: { choices: ["Option A", "Option B", "Option C", "Option D"] },
            answerKey: { index: 0 },
            maxScore: 1,
          })),
        },
        {
          type: "READING", // Verbal Module 2
          title: SAT_STRUCTURE.VERBAL.modules[1].name,
          instruction: JSON.stringify({
            text: "Complete all questions in this module. You have 32 minutes.",
          }),
          durationMin: SAT_STRUCTURE.VERBAL.modules[1].duration,
          order: SAT_STRUCTURE.VERBAL.modules[1].order,
          questions: Array.from({ length: questionCounts.verbalModule2 }, (_, i) => ({
            qtype: "MCQ_SINGLE",
            order: i,
            prompt: { text: `Question ${i + 1}` },
            options: { choices: ["Option A", "Option B", "Option C", "Option D"] },
            answerKey: { index: 0 },
            maxScore: 1,
          })),
        },
        {
          type: "WRITING", // Math Module 1
          title: SAT_STRUCTURE.MATH.modules[0].name,
          instruction: JSON.stringify({
            text: "Complete all questions in this module. You have 35 minutes.",
          }),
          durationMin: SAT_STRUCTURE.MATH.modules[0].duration,
          order: SAT_STRUCTURE.MATH.modules[0].order,
          questions: Array.from({ length: questionCounts.mathModule1 }, (_, i) => ({
            qtype: "MCQ_SINGLE",
            order: i,
            prompt: { text: `Question ${i + 1}` },
            options: { choices: ["Option A", "Option B", "Option C", "Option D"] },
            answerKey: { index: 0 },
            maxScore: 1,
          })),
        },
        {
          type: "WRITING", // Math Module 2
          title: SAT_STRUCTURE.MATH.modules[1].name,
          instruction: JSON.stringify({
            text: "Complete all questions in this module. You have 35 minutes.",
          }),
          durationMin: SAT_STRUCTURE.MATH.modules[1].duration,
          order: SAT_STRUCTURE.MATH.modules[1].order,
          questions: Array.from({ length: questionCounts.mathModule2 }, (_, i) => ({
            qtype: "MCQ_SINGLE",
            order: i,
            prompt: { text: `Question ${i + 1}` },
            options: { choices: ["Option A", "Option B", "Option C", "Option D"] },
            answerKey: { index: 0 },
            maxScore: 1,
          })),
        },
      ];

      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          category: "SAT",
          sections,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("SAT Exam created successfully! You can now edit questions for each module.");
        router.push(`/dashboard/admin/exams/${data.exam.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create exam");
      }
    } catch (error) {
      console.error("Failed to create SAT exam:", error);
      alert("Failed to create exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Digital SAT Exam</h1>
        <p className="text-gray-600 mt-2">
          Set up a new Digital SAT exam with the official structure and timing
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Exam Title */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Title *
          </label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="e.g., Digital SAT Practice Test 1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>


        {/* Math Section */}
        <div className="bg-white border-2 border-purple-200 rounded-lg overflow-hidden">
          <div className="bg-purple-50 px-6 py-4 border-b-2 border-purple-200">
            <h2 className="text-xl font-bold text-purple-900">📐 Math Section</h2>
            <p className="text-sm text-purple-700 mt-1">
              2 modules • 35 minutes each
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Math Module 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Module 1</h3>
                  <p className="text-sm text-gray-600">35 minutes • Minimum 22 questions</p>
                </div>
                {errors.mathModule1 && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="22"
                  value={questionCounts.mathModule1}
                  onChange={(e) =>
                    setQuestionCounts({ ...questionCounts, mathModule1: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.mathModule1
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.mathModule1 && (
                  <p className="text-sm text-red-600 mt-1">{errors.mathModule1}</p>
                )}
              </div>
            </div>

            {/* Math Module 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Module 2</h3>
                  <p className="text-sm text-gray-600">35 minutes • Minimum 22 questions</p>
                </div>
                {errors.mathModule2 && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="22"
                  value={questionCounts.mathModule2}
                  onChange={(e) =>
                    setQuestionCounts({ ...questionCounts, mathModule2: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.mathModule2
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.mathModule2 && (
                  <p className="text-sm text-red-600 mt-1">{errors.mathModule2}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verbal Section */}
        <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-6 py-4 border-b-2 border-green-200">
            <h2 className="text-xl font-bold text-green-900">📚 Verbal Section</h2>
            <p className="text-sm text-green-700 mt-1">
              2 modules • 32 minutes each
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Verbal Module 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Module 1</h3>
                  <p className="text-sm text-gray-600">32 minutes • Minimum 27 questions</p>
                </div>
                {errors.verbalModule1 && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="27"
                  value={questionCounts.verbalModule1}
                  onChange={(e) =>
                    setQuestionCounts({ ...questionCounts, verbalModule1: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.verbalModule1
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.verbalModule1 && (
                  <p className="text-sm text-red-600 mt-1">{errors.verbalModule1}</p>
                )}
              </div>
            </div>

            {/* Verbal Module 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Module 2</h3>
                  <p className="text-sm text-gray-600">32 minutes • Minimum 27 questions</p>
                </div>
                {errors.verbalModule2 && (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="27"
                  value={questionCounts.verbalModule2}
                  onChange={(e) =>
                    setQuestionCounts({ ...questionCounts, verbalModule2: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.verbalModule2
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {errors.verbalModule2 && (
                  <p className="text-sm text-red-600 mt-1">{errors.verbalModule2}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Important Information
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>Students must complete modules in order (Math 1 → Math 2 → Verbal 1 → Verbal 2)</li>
            <li>Each module has a strict timer that auto-submits when time expires</li>
            <li>Once a module timer expires or is submitted, students cannot edit answers</li>
            <li>After creating, you can edit individual questions for each module</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateExam}
            disabled={saving}
            className="px-6 py-3 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = "#303380";
            }}
          >
            <Save className="w-5 h-5" />
            {saving ? "Creating..." : "Create SAT Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}

