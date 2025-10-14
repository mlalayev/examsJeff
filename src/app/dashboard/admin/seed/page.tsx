"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";

export default function AdminSeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedA2Unit1 = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/seed/a2-unit1", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.details || "Failed to seed exam");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const deleteA2Unit1 = async () => {
    if (!confirm("Are you sure you want to delete the demo exam?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/seed/a2-unit1", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete exam");
      } else {
        setResult(null);
        alert("Demo exam deleted successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed Demo Exams</h1>
        <p className="text-gray-600">
          Create demo exams with sample questions for testing and development
        </p>
      </div>

      {/* Seed Cards */}
      <div className="grid gap-6">
        {/* A2 Unit 1 Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                General English A2 — Unit 1
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Demo exam with 5 sections and 15 questions covering all question types
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Reading (3 Q)
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Listening (3 Q)
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  Writing (2 Q)
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  Grammar (3 Q)
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                  Vocabulary (3 Q)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">MCQ</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">GAP</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">TF</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">ORDER</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">DND_MATCH</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">SHORT_TEXT</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">ESSAY</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={seedA2Unit1}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Seed Exam
            </button>

            {result && (
              <button
                onClick={deleteA2Unit1}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Exam
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 text-lg mb-1">Exam Created Successfully!</h3>
              <p className="text-sm text-green-700">Demo exam has been seeded to the database</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-600">Exam ID</dt>
                <dd className="mt-1 font-mono text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {result.examId}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Title</dt>
                <dd className="mt-1 text-gray-900">{result.title}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Category</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {result.category}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Track</dt>
                <dd className="mt-1">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {result.track}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Sections</dt>
                <dd className="mt-1 text-gray-900">{result.sectionsCount}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Total Questions</dt>
                <dd className="mt-1 text-gray-900">{result.questionsCount}</dd>
              </div>
            </dl>

            {/* Sections Details */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Sections</h4>
              <div className="space-y-2">
                {result.sections?.map((section: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-3">
                    <div>
                      <span className="font-medium text-gray-900">{section.title}</span>
                      <span className="ml-2 text-sm text-gray-600">({section.type})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {section.questionsCount} questions
                      </span>
                      <div className="flex gap-1">
                        {section.questionTypes.map((type: string) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 bg-white border border-gray-300 text-xs text-gray-700 rounded"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

