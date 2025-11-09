"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  XCircle, 
  Award, 
  ArrowLeft,
  BarChart3,
  Lock,
  X
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

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
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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

  const openSectionModal = (section: any) => {
    if (data && data.role === "TEACHER") {
      setSelectedSection(section);
      setShowModal(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSection(null);
    document.body.style.overflow = 'unset';
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
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-72">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-4 w-4 bg-gray-400 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-400 rounded w-16 animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-400 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-400 rounded w-48 animate-pulse"></div>
            </div>

            {/* Overall Score Card Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-5 bg-gray-400 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-400 rounded w-48 animate-pulse"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-10 bg-gray-400 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-400 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              <div className="h-1 bg-gray-300 rounded-full w-full animate-pulse"></div>
            </div>

            {/* Section Results Skeleton */}
            <div className="mb-6">
              <div className="h-6 bg-gray-400 rounded w-32 mb-4 animate-pulse"></div>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-400 rounded-md animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-5 bg-gray-400 rounded w-32 animate-pulse"></div>
                            <div className="h-4 bg-gray-400 rounded w-40 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="h-6 bg-gray-400 rounded w-12 animate-pulse"></div>
                          <div className="w-32 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Restricted Message Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-400 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-400 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-72 flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Results not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-72">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">{data.examTitle}</h1>
          <p className="text-gray-500">
            {new Date(data.submittedAt).toLocaleDateString()}
            {data.role === "TEACHER" && ` • ${data.studentName}`}
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Overall Score</h2>
              <p className="text-sm text-gray-600">
                {data.summary.totalCorrect} out of {data.summary.totalQuestions} questions correct
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{data.summary.totalPercentage}%</div>
              {data.summary.totalPercentage >= 75 && (
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <Award className="w-4 h-4" />
                  Passed
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: data.summary.totalPercentage >= 75 ? '#22c55e' : '#303380',
                width: `${data.summary.totalPercentage}%`
              }}
            ></div>
          </div>
        </div>

        {/* Section Results */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Section Results</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {(data.summary.perSection || data.sections)?.map((section, index) => (
                <li 
                  key={`${section.type}-${index}`}
                  className={`p-4 hover:bg-gray-50 ${data.role === "TEACHER" ? "cursor-pointer" : ""}`}
                  onClick={() => openSectionModal(section)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{section.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <span>{section.correct} / {section.total} correct</span>
                          <span>•</span>
                          <span>{section.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-semibold text-gray-900">{section.percentage}%</div>
                      </div>
                      <div className="w-32">
                        <div className="relative w-full rounded-full h-2 bg-gray-200">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: section.percentage >= 75 ? '#22c55e' : '#303380',
                              width: `${section.percentage}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* STUDENT VIEW: Restricted message */}
        {data.role === "STUDENT" && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">Review Restricted</h4>
                <p className="text-xs text-gray-600">
                  Detailed review is not available. Contact your teacher for specific feedback.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Section Questions (Teacher only) */}
      {showModal && selectedSection && data.role === "TEACHER" && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedSection.title} - Questions Review
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Section Summary */}
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Section Performance</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedSection.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: selectedSection.percentage >= 75 ? '#22c55e' : '#303380',
                      width: `${selectedSection.percentage}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedSection.correct} out of {selectedSection.total} questions correct
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {data.sections && data.sections.find(s => s.type === selectedSection.type)?.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`p-4 border rounded-lg ${
                      q.isCorrect 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!q.isCorrect && (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">
                            Q{idx + 1}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {q.qtype}
                          </span>
                        </div>

                        {/* Question Prompt */}
                        {q.prompt?.passage && (
                          <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <p className="text-sm italic text-gray-700">
                              {q.prompt.passage}
                            </p>
                          </div>
                        )}
                        {q.prompt?.transcript && (
                          <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <p className="text-xs font-medium mb-1 text-gray-600">🎧 Transcript:</p>
                            <p className="text-sm text-gray-700">
                              {q.prompt.transcript}
                            </p>
                          </div>
                        )}
                        <p className="font-medium mb-3 text-gray-900">
                          {q.prompt?.text || "Question"}
                        </p>

                        {/* Answers */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium uppercase text-gray-600">
                              Student Answer:
                            </span>
                            <p className="text-sm mt-1 text-gray-800">
                              {formatAnswer(q.qtype, q.studentAnswer, q.options)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium uppercase text-gray-600">
                              Correct Answer:
                            </span>
                            <p className="text-sm font-medium mt-1 text-gray-900">
                              {formatAnswer(q.qtype, q.correctAnswer?.value ?? q.correctAnswer?.index ?? q.correctAnswer?.indices ?? q.correctAnswer?.answers?.[0] ?? q.correctAnswer?.order ?? q.correctAnswer?.blanks, q.options)}
                            </p>
                          </div>
                          {q.explanation && (
                            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                              <span className="text-xs font-medium uppercase text-gray-600">
                                Explanation:
                              </span>
                              <p className="text-sm mt-1 text-gray-700">
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
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}