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
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/attempts/${attemptId}/results?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load results");
      
      console.log('📊 Results data fetched at', new Date().toLocaleTimeString(), ':', json);
      console.log('📊 Sections:', json.sections?.map((s: any) => ({ 
        type: s.type, 
        questionsCount: s.questions?.length,
        questions: s.questions 
      })));
      
      // Debug ALL questions to see which ones have answers
      json.sections?.forEach((section: any) => {
        console.log(`📋 Section ${section.type} questions:`, section.questions?.map((q: any) => ({
          id: q.id,
          qtype: q.qtype,
          hasAnswer: !!q.studentAnswer,
          answer: q.studentAnswer,
          answerType: typeof q.studentAnswer,
        })));
      });
      
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
      console.log('📖 Opening modal for section:', section.type);
      console.log('📖 Section data:', section);
      console.log('📖 Questions in this section:', data.sections?.find(s => s.type === section.type)?.questions);
      setSelectedSection(section);
      setShowModal(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSection(null);
    setEditingQuestion(null);
    setEditedAnswers({});
    document.body.style.overflow = 'unset';
  };

  const handleEditAnswer = (questionId: string, currentAnswer: any) => {
    setEditingQuestion(questionId);
    setEditedAnswers({ [questionId]: currentAnswer });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedAnswers({});
  };

  const handleSaveAnswer = async (questionId: string, qtype: string) => {
    if (!selectedSection || !data) return;
    
    setSaving(true);
    try {
      const newAnswer = editedAnswers[questionId];
      
      console.log('💾 Saving answer:', {
        questionId,
        qtype,
        sectionType: selectedSection.type,
        newAnswer,
        newAnswerType: typeof newAnswer,
      });
      
      const res = await fetch(`/api/attempts/${attemptId}/update-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: selectedSection.type,
          questionId,
          answer: newAnswer,
        }),
      });
      
      const responseData = await res.json();
      console.log('💾 Save response:', responseData);
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to update answer');
      }
      
      // Refresh results with cache busting
      console.log('🔄 Refreshing results after save...');
      await fetchResults();
      
      // Force update the UI by closing edit mode
      setEditingQuestion(null);
      setEditedAnswers({});
      
      console.log('✅ Answer saved and results refreshed');
      alert('Answer updated successfully!');
    } catch (err: any) {
      console.error('❌ Error saving answer:', err);
      alert(err.message || 'Failed to update answer');
    } finally {
      setSaving(false);
    }
  };

  const formatAnswer = (qtype: string, answer: any, options: any): string => {
    // Debug logging
    if (qtype === "FILL_IN_BLANK") {
      console.log('🎨 formatAnswer called for FILL_IN_BLANK:', {
        answer,
        answerType: typeof answer,
        answerKeys: answer && typeof answer === 'object' ? Object.keys(answer) : [],
        answerValues: answer && typeof answer === 'object' ? Object.values(answer) : [],
        isNull: answer === null,
        isUndefined: answer === undefined,
        rawAnswer: JSON.stringify(answer),
      });
    }
    
    // Special handling for FILL_IN_BLANK BEFORE the general check
    if (qtype === "FILL_IN_BLANK") {
      // For student answer (object with blank indices)
      if (typeof answer === "object" && answer !== null && !Array.isArray(answer)) {
        // Get all keys and sort them numerically
        const keys = Object.keys(answer).sort((a, b) => parseInt(a) - parseInt(b));
        
        // If empty object or no keys
        if (keys.length === 0) {
          console.log('⚠️ FILL_IN_BLANK: Empty object, no keys');
          return "No answer";
        }
        
        // Check if all values are empty/undefined/null
        const hasAnyValue = keys.some(key => {
          const val = answer[key];
          return val !== null && val !== undefined && String(val).trim() !== '';
        });
        
        if (!hasAnyValue) {
          console.log('⚠️ FILL_IN_BLANK: All values are empty');
          return "No answer";
        }
        
        // Convert { "0": "answer1", "1": "answer2" } to numbered list
        const formatted = keys.map((key) => {
          const val = answer[key];
          const blankNum = parseInt(key) + 1;
          if (val === null || val === undefined || String(val).trim() === '') {
            return `${blankNum}. (empty)`;
          }
          return `${blankNum}. ${String(val).trim()}`;
        }).join(", ");
        
        console.log('✅ FILL_IN_BLANK formatted:', formatted);
        return formatted;
      }
      // For correct answer (array of alternatives)
      if (Array.isArray(answer)) {
        return answer.map((alternatives, idx) => {
          if (Array.isArray(alternatives)) {
            return `${idx + 1}. ${alternatives.join(" / ")}`;
          }
          return `${idx + 1}. ${alternatives}`;
        }).join(", ");
      }
      console.log('⚠️ FILL_IN_BLANK: Not object or array');
      return "No answer";
    }
    
    // General check for other question types
    if (!answer && answer !== 0 && answer !== false) {
      console.log(`⚠️ No answer detected for ${qtype}`);
      return "No answer";
    }

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
                        {/* IELTS Listening Part Breakdown (Teacher Only) */}
                        {data.role === "TEACHER" && section.type === "LISTENING" && section.listeningParts && (
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <span className="text-gray-500">Parts:</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">P1: {section.listeningParts.s1}/10</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">P2: {section.listeningParts.s2}/10</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">P3: {section.listeningParts.s3}/10</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">P4: {section.listeningParts.s4}/10</span>
                          </div>
                        )}
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
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
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium uppercase text-gray-600">
                                Student Answer:
                              </span>
                              {editingQuestion !== q.id && (
                                <button
                                  onClick={() => handleEditAnswer(q.id, q.studentAnswer)}
                                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                            
                            {editingQuestion === q.id ? (
                              <div className="space-y-2">
                                {q.qtype === "FILL_IN_BLANK" ? (
                                  <div className="space-y-2">
                                    {(() => {
                                      const currentAnswer = editedAnswers[q.id] || q.studentAnswer || {};
                                      const blankCount = Array.isArray(q.correctAnswer) ? q.correctAnswer.length : Object.keys(currentAnswer).length;
                                      const maxBlanks = Math.max(blankCount, Object.keys(currentAnswer).length);
                                      
                                      return Array.from({ length: maxBlanks }, (_, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600">Blank {i + 1}:</span>
                                          <input
                                            type="text"
                                            value={currentAnswer[String(i)] || ""}
                                            onChange={(e) => {
                                              setEditedAnswers({
                                                ...editedAnswers,
                                                [q.id]: {
                                                  ...currentAnswer,
                                                  [String(i)]: e.target.value,
                                                },
                                              });
                                            }}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                            placeholder={`Answer for blank ${i + 1}`}
                                          />
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                ) : q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT" ? (
                                  <select
                                    value={editedAnswers[q.id] ?? ""}
                                    onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: parseInt(e.target.value) })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Select answer</option>
                                    {q.options?.choices?.map((choice: string, idx: number) => (
                                      <option key={idx} value={idx}>{choice}</option>
                                    ))}
                                  </select>
                                ) : q.qtype === "TF" ? (
                                  <select
                                    value={editedAnswers[q.id] ?? ""}
                                    onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: parseInt(e.target.value) })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">Select answer</option>
                                    <option value="0">True</option>
                                    <option value="1">False</option>
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={typeof editedAnswers[q.id] === 'string' ? editedAnswers[q.id] : JSON.stringify(editedAnswers[q.id] || "")}
                                    onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                )}
                                
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleSaveAnswer(q.id, q.qtype)}
                                    disabled={saving}
                                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                                  >
                                    {saving ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm mt-1 text-gray-800">
                                {formatAnswer(q.qtype, q.studentAnswer, q.options)}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-medium uppercase text-gray-600">
                              Correct Answer:
                            </span>
                            <p className="text-sm font-medium mt-1 text-gray-900">
                              {(() => {
                                // For FILL_IN_BLANK, use the full correctAnswer array
                                if (q.qtype === "FILL_IN_BLANK") {
                                  return formatAnswer(q.qtype, q.correctAnswer, q.options);
                                }
                                // For other types, extract the appropriate field
                                const correctValue = q.correctAnswer?.value ?? 
                                  q.correctAnswer?.index ?? 
                                  q.correctAnswer?.indices ?? 
                                  q.correctAnswer?.answers?.[0] ?? 
                                  q.correctAnswer?.order ?? 
                                  q.correctAnswer?.blanks ??
                                  q.correctAnswer;
                                return formatAnswer(q.qtype, correctValue, q.options);
                              })()}
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