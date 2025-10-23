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
  Lock,
  X
} from "lucide-react";
import Loading from "@/components/loading/Loading";

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

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const openSectionModal = (section: any) => {
    if (data.role === "TEACHER") {
      setSelectedSection(section);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSection(null);
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
        <Loading size="lg" variant="spinner" />
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
    <div className="min-h-screen" style={{ backgroundColor: 'rgba(48, 51, 128, 0.02)' }}>
      {/* Minimal Header */}
      <div className="border-b" style={{ borderColor: 'rgba(48, 51, 128, 0.1)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm mb-4 transition-colors"
            style={{ color: 'rgba(48, 51, 128, 0.7)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#303380'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(48, 51, 128, 0.7)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold" style={{ color: '#303380' }}>{data.examTitle}</h1>
              <p className="text-sm" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                {new Date(data.submittedAt).toLocaleDateString()}
              </p>
            </div>
            {data.role === "TEACHER" && (
              <div className="text-sm" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                {data.studentName}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
            <span>Overall Progress</span>
            <div className="text-right">
              <div className="font-semibold" style={{ color: '#303380' }}>{data.summary.totalPercentage}%</div>
              <div className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                {data.summary.totalCorrect} / {data.summary.totalQuestions} correct
              </div>
            </div>
          </div>
          <div className="relative w-full rounded-full h-2" style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                backgroundColor: '#303380',
                width: `${data.summary.totalPercentage}%`
              }}
            ></div>
            
            {/* 75% Pass Mark Indicator */}
            <div 
              className="absolute top-0 h-2 w-0.5"
              style={{ 
                left: '75%',
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                transform: 'translateX(-50%)'
              }}
            ></div>
            <div 
              className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs font-medium"
              style={{ 
                color: 'rgba(34, 197, 94, 0.8)',
                left: '75%'
              }}
            >
              75% (passed)
            </div>
          </div>
        </div>

        {/* Section Results Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium mb-4" style={{ color: '#303380' }}>Section Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data.summary.perSection || data.sections)?.map((section, index) => (
              <div
                key={`${section.type}-${index}`}
                className="bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                style={{
                  borderColor: 'rgba(48, 51, 128, 0.1)',
                  backgroundColor: 'rgba(48, 51, 128, 0.01)'
                }}
                onClick={() => openSectionModal(section)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.01)';
                  e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.1)';
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm" style={{ color: '#303380' }}>{section.title}</h3>
                  <div className="text-right">
                    <div className="text-xl font-semibold" style={{ color: '#303380' }}>
                      {section.percentage}%
                    </div>
                    <div className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                      {section.correct} / {section.total}
                    </div>
                  </div>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: '#303380',
                      width: `${section.percentage}%`
                    }}
                  ></div>
                </div>
                {data.role === "TEACHER" && (
                  <p className="text-xs mt-2" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                    Click to view questions
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* STUDENT VIEW: Minimal info */}
        {data.role === "STUDENT" && (
          <div className="mt-8 p-4 border rounded-lg" style={{ 
            backgroundColor: 'rgba(48, 51, 128, 0.05)',
            borderColor: 'rgba(48, 51, 128, 0.15)'
          }}>
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 mt-0.5" style={{ color: 'rgba(48, 51, 128, 0.7)' }} />
              <div>
                <h4 className="font-medium text-sm" style={{ color: '#303380' }}>Review Restricted</h4>
                <p className="text-xs mt-1" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                  Detailed review is not available. Contact your teacher for specific feedback.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal for Section Questions */}
      {showModal && selectedSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(48, 51, 128, 0.1)' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#303380' }}>
                {selectedSection.title} - Questions Review
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'rgba(48, 51, 128, 0.6)' }} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(48, 51, 128, 0.05)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium" style={{ color: '#303380' }}>Section Performance</span>
                  <span className="text-lg font-semibold" style={{ color: '#303380' }}>
                    {selectedSection.percentage}%
                  </span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: '#303380',
                      width: `${selectedSection.percentage}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm mt-2" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                  {selectedSection.correct} out of {selectedSection.total} questions correct
                </p>
              </div>

              <div className="space-y-4">
                {data.sections && data.sections.find(s => s.type === selectedSection.type)?.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 border rounded-lg"
                    style={{
                      borderColor: q.isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      backgroundColor: q.isCorrect ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {q.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold" style={{ color: '#303380' }}>
                            Q{idx + 1}
                          </span>
                          <span className="text-xs px-2 py-1 rounded" style={{ 
                            backgroundColor: 'rgba(48, 51, 128, 0.1)',
                            color: 'rgba(48, 51, 128, 0.7)'
                          }}>
                            {q.qtype}
                          </span>
                        </div>

                        {/* Question Prompt */}
                        {q.prompt?.passage && (
                          <div className="mb-3 p-3 border rounded-lg" style={{
                            backgroundColor: 'rgba(48, 51, 128, 0.02)',
                            borderColor: 'rgba(48, 51, 128, 0.1)'
                          }}>
                            <p className="text-sm italic" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
                              {q.prompt.passage}
                            </p>
                          </div>
                        )}
                        {q.prompt?.transcript && (
                          <div className="mb-3 p-3 border rounded-lg" style={{
                            backgroundColor: 'rgba(48, 51, 128, 0.02)',
                            borderColor: 'rgba(48, 51, 128, 0.1)'
                          }}>
                            <p className="text-xs font-medium mb-1" style={{ color: 'rgba(48, 51, 128, 0.8)' }}>🎧 Transcript:</p>
                            <p className="text-sm" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
                              {q.prompt.transcript}
                            </p>
                          </div>
                        )}
                        <p className="font-medium mb-3" style={{ color: '#303380' }}>
                          {q.prompt?.text || "Question"}
                        </p>

                        {/* Answers */}
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium uppercase" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                              Student Answer:
                            </span>
                            <p className="text-sm mt-1" style={{ color: 'rgba(48, 51, 128, 0.8)' }}>
                              {formatAnswer(q.qtype, q.studentAnswer, q.options)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium uppercase" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                              Correct Answer:
                            </span>
                            <p className="text-sm font-medium mt-1" style={{ color: '#303380' }}>
                              {formatAnswer(q.qtype, q.correctAnswer?.value ?? q.correctAnswer?.index ?? q.correctAnswer?.indices ?? q.correctAnswer?.answers?.[0] ?? q.correctAnswer?.order ?? q.correctAnswer?.blanks, q.options)}
                            </p>
                          </div>
                          {q.explanation && (
                            <div className="mt-3 p-3 border rounded-lg" style={{
                              backgroundColor: 'rgba(48, 51, 128, 0.02)',
                              borderColor: 'rgba(48, 51, 128, 0.1)'
                            }}>
                              <span className="text-xs font-medium uppercase" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
                                Explanation:
                              </span>
                              <p className="text-sm mt-1" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
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
    </div>
  );
}
