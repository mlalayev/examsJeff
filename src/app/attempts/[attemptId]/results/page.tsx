"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  XCircle, 
  Award, 
  ArrowLeft,
  BarChart3,
  Lock,
  X,
  FileCheck,
  Users,
  CheckCircle2,
  Edit2,
  Save,
  FileText,
  AlertCircle
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
      listeningParts?: {
        s1: number;
        s2: number;
        s3: number;
        s4: number;
      };
    }>;
  };
  sections?: Array<{
    type: string;
    title: string;
    correct: number;
    total: number;
    percentage: number;
    listeningParts?: {
      s1: number;
      s2: number;
      s3: number;
      s4: number;
    };
    questions: Array<{
      id: string;
      qtype: string;
      prompt: any;
      options: any;
      order: number;
      maxScore: number;
      image?: string | null;
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
  const [showReviewRestrictedModal, setShowReviewRestrictedModal] = useState(false);

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
      
      // Show review restricted modal for students on page load
      if (json.role === "STUDENT") {
        setShowReviewRestrictedModal(true);
      }
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
    // Find the question
    const question = data?.sections
      ?.flatMap(s => s.questions || [])
      .find(q => q.id === questionId);
    
    if (!question) {
      alert('Question not found');
      return;
    }
    
    let answerToEdit = currentAnswer;
    
    // For MCQ_SINGLE/SELECT: convert text to index if needed
    if ((question.qtype === "MCQ_SINGLE" || question.qtype === "SELECT" || question.qtype === "INLINE_SELECT")) {
      if (typeof currentAnswer === "string") {
        const choices = question.options?.choices || [];
        const index = choices.findIndex((c: string) => c === currentAnswer);
        answerToEdit = index >= 0 ? index : undefined;
      } else if (typeof currentAnswer === "number") {
        answerToEdit = currentAnswer;
      } else {
        answerToEdit = undefined;
      }
    }
    // For FILL_IN_BLANK: ensure it's an object
    else if (question.qtype === "FILL_IN_BLANK") {
      if (!currentAnswer || typeof currentAnswer !== "object" || Array.isArray(currentAnswer)) {
        answerToEdit = {};
      } else {
        answerToEdit = currentAnswer;
      }
    }
    
    console.log('✏️ EDIT:', { questionId, qtype: question.qtype, original: currentAnswer, normalized: answerToEdit });
    
    setEditingQuestion(questionId);
    setEditedAnswers({ [questionId]: answerToEdit });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditedAnswers({});
  };

  const handleSaveAnswer = async (questionId: string, qtype: string) => {
    if (!selectedSection || !data) {
      alert('Error: Missing section or data');
      return;
    }
    
    // Get the answer from editedAnswers, or keep the original if not edited
    let answerToSave = editedAnswers[questionId];
    
    // If answer is not in editedAnswers, use the original student answer
    if (answerToSave === undefined) {
      const question = data.sections
        ?.flatMap(s => s.questions || [])
        .find(q => q.id === questionId);
      answerToSave = question?.studentAnswer;
    }
    
    console.log('💾 SAVING:', {
      questionId,
      qtype,
      sectionType: selectedSection.type,
      answerToSave,
      answerType: typeof answerToSave,
      editedAnswersKeys: Object.keys(editedAnswers),
    });
    
    setSaving(true);
    try {
      const response = await fetch(`/api/attempts/${attemptId}/update-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: selectedSection.type,
          questionId,
          answer: answerToSave,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save answer');
      }
      
      console.log('✅ SAVED SUCCESSFULLY:', result);
      
      // Close edit mode
      setEditingQuestion(null);
      setEditedAnswers({});
      
      // Refresh the data
      await fetchResults();
      
      alert('Answer saved successfully!');
    } catch (error: any) {
      console.error('❌ SAVE ERROR:', error);
      alert('Error: ' + (error.message || 'Failed to save answer'));
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
      case "TF_NG":
        if (typeof answer === "string") {
          const upper = answer.toUpperCase();
          if (upper === "TRUE") return "True";
          if (upper === "FALSE") return "False";
          if (upper === "NOT_GIVEN") return "Not Given";
        }
        return "No answer";
      case "MCQ_SINGLE":
      case "SELECT":
      case "INLINE_SELECT":
        // Answer can be either a number (index) or already converted text
        if (typeof answer === "number" && options?.choices?.[answer]) {
          return options.choices[answer];
        }
        if (typeof answer === "string") {
          return answer; // Already converted to text by API
        }
        return answer !== undefined && answer !== null ? `Option ${answer}` : "No answer";
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
      case "SPEAKING_RECORDING":
        // For speaking recording, show the audio player
        if (answer && typeof answer === "object" && answer.audioUrl) {
          return ""; // We'll handle audio player separately in the UI
        }
        return "No recording";
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

      {/* Review Restricted Modal for Students */}
      {showReviewRestrictedModal && data?.role === "STUDENT" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Results Under Review
              </h2>
              <p className="text-xs text-gray-500">
                Your exam has been submitted successfully
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-3 mb-4">
                <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Your exam results are currently being reviewed by your teachers. 
                    They will carefully check your answers and provide detailed feedback.
                  </p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>What happens next?</strong> Your teachers will review your exam and notify you once the review is complete. 
                  You'll be able to see detailed feedback and explanations for each question.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowReviewRestrictedModal(false)}
                className="w-full rounded-md bg-[#303380] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#252a6b] transition-colors shadow-sm hover:shadow-md"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Section Questions (Teacher only) */}
      {showModal && selectedSection && data.role === "TEACHER" && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedSection.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Questions Review</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* Section Summary Card */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Section Performance</p>
                      <p className="text-2xl font-bold text-gray-900 mt-0.5">
                        {selectedSection.percentage}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedSection.correct} / {selectedSection.total}
                    </p>
                  </div>
                </div>
                <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      backgroundColor: selectedSection.percentage >= 75 ? '#22c55e' : '#303380',
                      width: `${selectedSection.percentage}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {data.sections && data.sections.find(s => s.type === selectedSection.type)?.questions.map((q, idx) => (
                  <div key={q.id}>
                    {idx > 0 && (
                      <div className="h-0.5 bg-gray-300 my-5"></div>
                    )}
                    <div
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        q.isCorrect 
                          ? "bg-white border-green-200 shadow-sm" 
                          : "bg-white border-red-200 shadow-sm"
                      }`}
                    >
                    {/* Question Header */}
                    <div className={`px-5 py-3 border-b ${
                      q.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            q.isCorrect ? "bg-green-100" : "bg-red-100"
                          }`}>
                            {q.isCorrect ? (
                              <CheckCircle2 className={`w-5 h-5 ${q.isCorrect ? "text-green-600" : "text-red-600"}`} />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-lg">
                                Question {idx + 1}
                              </span>
                              <span className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium border border-gray-200">
                                {q.qtype}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!q.isCorrect && editingQuestion !== q.id && (
                          <button
                            onClick={() => handleEditAnswer(q.id, q.studentAnswer)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Answer
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-5 space-y-4">
                      {/* Question Image (for FILL_IN_BLANK) */}
                      {q.image && q.qtype === "FILL_IN_BLANK" && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                          <div className="relative w-full flex justify-center" style={{ minHeight: "200px" }}>
                            <img
                              src={q.image}
                              alt="Question image"
                              className="h-auto object-contain"
                              style={{ width: "90%", minWidth: "90%", maxHeight: "400px" }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Question Instructions (for FILL_IN_BLANK) */}
                      {q.prompt?.instructions && q.qtype === "FILL_IN_BLANK" && (
                        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                          <p className="text-sm font-medium text-blue-900">
                            {q.prompt.instructions}
                          </p>
                        </div>
                      )}
                      {/* Question Prompt */}
                      {q.prompt?.passage && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Reading Passage</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed italic whitespace-pre-line">
                            {typeof q.prompt.passage === 'object' && q.prompt.passage !== null
                              ? Object.values(q.prompt.passage).join('\n\n')
                              : q.prompt.passage}
                          </p>
                        </div>
                      )}
                      {q.prompt?.transcript && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Transcript</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {q.prompt.transcript}
                          </p>
                        </div>
                      )}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-gray-600 mb-1">Question:</p>
                        <p className="text-base font-semibold text-gray-900 leading-relaxed">
                          {q.prompt?.text || "Question"}
                        </p>
                      </div>

                      {/* Answers Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Answer */}
                        <div className={`p-4 rounded-lg border-2 ${
                          q.isCorrect 
                            ? "bg-green-50 border-green-300" 
                            : "bg-red-50 border-red-300"
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            {q.isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                              Student Answer
                            </span>
                          </div>
                          
                          {editingQuestion === q.id ? (
                            <div className="space-y-3">
                              {q.qtype === "FILL_IN_BLANK" ? (
                                <div className="space-y-2">
                                  {(() => {
                                    const currentAnswer = editedAnswers[q.id] || q.studentAnswer || {};
                                    const blankCount = Array.isArray(q.correctAnswer) ? q.correctAnswer.length : Object.keys(currentAnswer).length;
                                    const maxBlanks = Math.max(blankCount, Object.keys(currentAnswer).length);
                                    
                                    return Array.from({ length: maxBlanks }, (_, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-600 w-16">Blank {i + 1}:</span>
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
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder={`Answer for blank ${i + 1}`}
                                        />
                                      </div>
                                    ));
                                  })()}
                                </div>
                              ) : q.qtype === "MCQ_SINGLE" || q.qtype === "SELECT" || q.qtype === "INLINE_SELECT" ? (
                                <select
                                  value={
                                    editedAnswers[q.id] !== undefined 
                                      ? String(editedAnswers[q.id]) 
                                      : (typeof q.studentAnswer === "number" 
                                          ? String(q.studentAnswer) 
                                          : (typeof q.studentAnswer === "string"
                                              ? String(q.options?.choices?.findIndex((c: string) => c === q.studentAnswer) ?? "")
                                              : ""))
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const numValue = val === "" ? undefined : parseInt(val);
                                    setEditedAnswers({ ...editedAnswers, [q.id]: numValue });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">-- Select answer --</option>
                                  {q.options?.choices?.map((choice: string, idx: number) => (
                                    <option key={idx} value={idx}>{choice}</option>
                                  ))}
                                </select>
                              ) : q.qtype === "TF" ? (
                                <select
                                  value={editedAnswers[q.id] ?? ""}
                                  onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: parseInt(e.target.value) })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select answer</option>
                                  <option value="0">True</option>
                                  <option value="1">False</option>
                                </select>
                              ) : q.qtype === "TF_NG" ? (
                                <select
                                  value={editedAnswers[q.id] ?? ""}
                                  onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Select answer</option>
                                  <option value="TRUE">True</option>
                                  <option value="FALSE">False</option>
                                  <option value="NOT_GIVEN">Not Given</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={typeof editedAnswers[q.id] === 'string' ? editedAnswers[q.id] : JSON.stringify(editedAnswers[q.id] || "")}
                                  onChange={(e) => setEditedAnswers({ ...editedAnswers, [q.id]: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                              
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleSaveAnswer(q.id, q.qtype)}
                                  disabled={saving}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  <Save className="w-4 h-4" />
                                  {saving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {q.qtype === "SPEAKING_RECORDING" && q.studentAnswer?.audioUrl ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-600">Recorded Answer:</p>
                                  <audio controls src={q.studentAnswer.audioUrl} className="w-full">
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              ) : (
                                <p className={`text-sm font-medium ${
                                  q.isCorrect ? "text-green-800" : "text-red-800"
                                }`}>
                                  {formatAnswer(q.qtype, q.studentAnswer, q.options)}
                                </p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Correct Answer */}
                        <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-gray-600" />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                              Correct Answer
                            </span>
                          </div>
                          {q.qtype === "SPEAKING_RECORDING" ? (
                            <p className="text-sm font-medium text-gray-600 italic">
                              Manual grading required by teacher
                            </p>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">
                              {(() => {
                                if (q.qtype === "FILL_IN_BLANK") {
                                  return formatAnswer(q.qtype, q.correctAnswer, q.options);
                                }
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
                          )}
                        </div>
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Explanation</span>
                          </div>
                          <p className="text-sm text-amber-900 leading-relaxed">
                            {q.explanation.text || JSON.stringify(q.explanation)}
                          </p>
                        </div>
                      )}
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