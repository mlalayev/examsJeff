"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle, 
  XCircle, 
  Award, 
  ArrowLeft,
  Loader2,
  BarChart3,
  Eye,
  Lock
} from "lucide-react";

interface ResultsData {
  attemptId: string;
  examTitle: string;
  studentName: string;
  submittedAt: string;
  status: string;
  role: "STUDENT" | "TEACHER";
  summary: {
    totalCorrect: number;
    totalQuestions: number;
    totalPercentage: number;
    perSection?: Array<{
      type: string;
      title: string;
      correct: number;
      total: number;
      percentage: number;
    }>;
  };
  sections?: Array<{
    type: string;
    title: string;
    correct: number;
    total: number;
    percentage: number;
    questions: Array<{
      id: string;
      qtype: string;
      prompt: any;
      options: any;
      order: number;
      maxScore: number;
      studentAnswer: any;
      correctAnswer: any;
      isCorrect: boolean;
      explanation: any;
    }>;
  }>;
}

export default function AttemptResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}/results`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load results");
      setData(json);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to load results");
      router.push("/dashboard/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  const formatAnswer = (qtype: string, answer: any, options: any): string => {
    if (!answer && answer !== 0 && answer !== false) return "No answer";

    switch (qtype) {
      case "TF":
        return answer ? "True" : "False";
      case "MCQ_SINGLE":
      case "SELECT":
        return options?.choices?.[answer] || `Option ${answer}`;
      case "MCQ_MULTI":
        if (!Array.isArray(answer)) return "No answer";
        return answer.map((idx) => options?.choices?.[idx] || `Option ${idx}`).join(", ");
      case "GAP":
        return answer || "No answer";
      case "ORDER_SENTENCE":
        if (!Array.isArray(answer)) return "No answer";
        return answer.join(" → ");
      case "DND_GAP":
        if (typeof answer === "object" && answer !== null) {
          return Object.values(answer).join(", ");
        }
        return JSON.stringify(answer);
      case "SHORT_TEXT":
      case "ESSAY":
        return answer || "No answer";
      default:
        return JSON.stringify(answer);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-gray-500">Results not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{data.examTitle}</h1>
              <p className="text-slate-600 mt-1">Results for {data.studentName}</p>
              <p className="text-sm text-slate-500 mt-1">
                Submitted: {new Date(data.submittedAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                <Award className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-sm text-slate-600">Overall Score</div>
                  <div className="text-3xl font-bold text-purple-700">
                    {data.summary.totalPercentage}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {data.summary.totalCorrect} / {data.summary.totalQuestions} correct
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Per-Section Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {(data.summary.perSection || data.sections)?.map((section) => (
            <div
              key={section.type}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900">{section.title}</h3>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-slate-900">{section.percentage}%</div>
                <div className="text-sm text-slate-500 mb-1">
                  {section.correct} / {section.total}
                </div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${section.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* STUDENT VIEW: Limited info */}
        {data.role === "STUDENT" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Review Restricted</h4>
                <p className="text-sm text-blue-700 mt-1">
                  For privacy and academic integrity, detailed question-by-question review is not available.
                  Your teacher has access to the full review and can discuss specific questions with you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TEACHER VIEW: Full review */}
        {data.role === "TEACHER" && data.sections && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Eye className="w-4 h-4" />
              <span>Full review mode (Teacher)</span>
            </div>

            {data.sections.map((section) => (
              <div key={section.type} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection(section.type)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                      {section.correct} / {section.total} correct
                    </span>
                  </div>
                  <div className="text-slate-400">
                    {expandedSections.has(section.type) ? "▼" : "▶"}
                  </div>
                </button>

                {expandedSections.has(section.type) && (
                  <div className="px-6 pb-6 space-y-4">
                    {section.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className={`p-5 border-2 rounded-lg ${
                          q.isCorrect
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {q.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-slate-900">Q{idx + 1}</span>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded">
                                {q.qtype}
                              </span>
                            </div>

                            {/* Question Prompt */}
                            {q.prompt?.passage && (
                              <div className="mb-2 p-3 bg-white border border-slate-200 rounded-lg">
                                <p className="text-sm text-slate-700 italic">{q.prompt.passage}</p>
                              </div>
                            )}
                            {q.prompt?.transcript && (
                              <div className="mb-2 p-3 bg-white border border-slate-200 rounded-lg">
                                <p className="text-xs text-green-700 font-medium mb-1">🎧 Transcript:</p>
                                <p className="text-sm text-slate-700">{q.prompt.transcript}</p>
                              </div>
                            )}
                            <p className="font-medium text-slate-900 mb-3">
                              {q.prompt?.text || "Question"}
                            </p>

                            {/* Answers */}
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-slate-600 uppercase">Your Answer:</span>
                                <p className="text-sm text-slate-900 mt-1">
                                  {formatAnswer(q.qtype, q.studentAnswer, q.options)}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-slate-600 uppercase">Correct Answer:</span>
                                <p className="text-sm text-green-700 font-medium mt-1">
                                  {formatAnswer(q.qtype, q.correctAnswer?.value ?? q.correctAnswer?.index ?? q.correctAnswer?.indices ?? q.correctAnswer?.answers?.[0] ?? q.correctAnswer?.order ?? q.correctAnswer?.blanks, q.options)}
                                </p>
                              </div>
                              {q.explanation && (
                                <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg">
                                  <span className="text-xs font-medium text-slate-600 uppercase">Explanation:</span>
                                  <p className="text-sm text-slate-700 mt-1">
                                    {q.explanation.text || JSON.stringify(q.explanation)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
