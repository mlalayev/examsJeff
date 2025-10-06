"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Award, FileText, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";

interface ReviewData {
  attemptId: string;
  status: string;
  submittedAt: string | null;
  bandOverall: number | null;
  sections: Array<{
    type: string;
    status: string;
    rawScore: number | null;
    bandScore: number | null;
    startedAt: string | null;
    endedAt: string | null;
    questions?: Array<{
      id: string;
      order: number;
      qtype: string;
      prompt: any;
      studentAnswer: any;
      correctAnswer: any;
      isCorrect: boolean;
      points: number;
      maxScore: number;
    }>;
    summary?: {
      correctCount: number;
      totalQuestions: number;
      rawScore: number;
      maxRawScore: number;
    };
    graded?: boolean;
    feedback?: string;
    message?: string;
    rubric?: any;
  }>;
}

export default function StudentResultsPage({ params }: { params: { attemptId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetchResults();
    }
  }, [session, params.attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attempts/${params.attemptId}/review`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch results");
      }
      const resultsData = await response.json();
      setData(resultsData);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (band: number) => {
    if (band >= 8) return "text-green-600 bg-green-50";
    if (band >= 7) return "text-blue-600 bg-blue-50";
    if (band >= 6) return "text-purple-600 bg-purple-50";
    if (band >= 5) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error || "Failed to load results"}</p>
          <button
            onClick={() => router.push("/dashboard/student")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/student")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Results</h1>
        <p className="text-gray-600">
          Submitted on{" "}
          {data.submittedAt
            ? new Date(data.submittedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A"}
        </p>
      </div>

      {/* Overall Band */}
      {data.bandOverall !== null && (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Overall Band Score</h2>
              </div>
              <p className="text-blue-100">Your average performance across all sections</p>
            </div>
            <div className="text-6xl font-bold">{data.bandOverall.toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {data.sections.map((section) => (
          <div key={section.type} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{section.type}</h3>
                  {section.summary && (
                    <p className="text-sm text-gray-600">
                      {section.summary.correctCount} / {section.summary.totalQuestions} correct
                    </p>
                  )}
                </div>
              </div>

              {section.bandScore !== null ? (
                <div
                  className={`px-6 py-3 rounded-xl font-bold text-2xl ${getBandColor(
                    section.bandScore
                  )}`}
                >
                  {section.bandScore.toFixed(1)}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Pending Grading</span>
                </div>
              )}
            </div>

            {/* Reading/Listening - Show Questions */}
            {section.questions && section.questions.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-4">Question Review</h4>
                <div className="space-y-3">
                  {section.questions.map((q) => (
                    <div
                      key={q.id}
                      className={`p-4 rounded-lg border-2 ${
                        q.isCorrect
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {q.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">
                            Question {q.order}: {q.prompt?.text || "Question"}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 font-medium">Your Answer:</p>
                              <p
                                className={
                                  q.isCorrect ? "text-green-700" : "text-red-700 font-medium"
                                }
                              >
                                {typeof q.studentAnswer === "object"
                                  ? JSON.stringify(q.studentAnswer)
                                  : q.studentAnswer || "(No answer)"}
                              </p>
                            </div>
                            {!q.isCorrect && (
                              <div>
                                <p className="text-gray-600 font-medium">Correct Answer:</p>
                                <p className="text-green-700 font-medium">
                                  {typeof q.correctAnswer === "object"
                                    ? JSON.stringify(q.correctAnswer)
                                    : q.correctAnswer}
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
            )}

            {/* Writing/Speaking - Show Feedback */}
            {(section.type === "WRITING" || section.type === "SPEAKING") && (
              <div className="mt-6">
                {section.graded ? (
                  <>
                    {/* Rubric (if available) */}
                    {section.rubric && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Detailed Rubric</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(section.rubric).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className="text-xs text-gray-600 mb-1">
                                {key
                                  .replace(/([A-Z])/g, " $1")
                                  .trim()
                                  .replace(/^./, (str) => str.toUpperCase())}
                              </p>
                              <p className="text-xl font-bold text-blue-600">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {section.feedback && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Teacher Feedback</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">{section.feedback}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!section.feedback && !section.rubric && (
                      <p className="text-gray-600 italic">No additional feedback provided.</p>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-yellow-800 font-medium">
                      {section.message || "This section is pending teacher grading."}
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      You'll be notified when your results are ready.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

