"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, FileText, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import AudioPlayer from "@/components/audio/AudioPlayer";

interface ExamSection {
  id: string;
  type: string;
  title: string;
  instruction: string | null;
  durationMin: number;
  order: number;
  questions: Question[];
}

interface Question {
  id: string;
  qtype: string;
  order: number;
  prompt: any;
  options: any;
  answerKey: any;
  maxScore: number;
  explanation: any;
}

interface Exam {
  id: string;
  title: string;
  category: string;
  track: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  sections: ExamSection[];
  _count: {
    questions: number;
    bookings: number;
  };
}

export default function AdminExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to load exam");
        router.push("/dashboard/admin/exams");
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      alert("Failed to load exam");
      router.push("/dashboard/admin/exams");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${exam?.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Exam deleted successfully");
        router.push("/dashboard/admin/exams");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete exam");
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
      alert("Failed to delete exam");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!exam) return;
    
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !exam.isActive }),
      });

      if (res.ok) {
        await fetchExam();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update exam status");
      }
    } catch (error) {
      console.error("Error updating exam:", error);
      alert("Failed to update exam status");
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header Skeleton */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-4 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-400 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-400 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-400 rounded w-80 animate-pulse"></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-9 bg-gray-400 rounded-md w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-400 rounded-md w-20 animate-pulse"></div>
              <div className="h-9 bg-gray-400 rounded-md w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-lg animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                  <div className="h-5 bg-gray-400 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-400 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Badge Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="h-8 bg-gray-400 rounded-full w-20 animate-pulse"></div>
        </div>

        {/* Sections Skeleton */}
        <div className="space-y-4 sm:space-y-6">
          <div className="h-6 bg-gray-400 rounded w-24 animate-pulse"></div>
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-400 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-400 rounded w-16 animate-pulse"></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="h-5 bg-gray-400 rounded w-24 mb-3 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="border border-gray-200 rounded-md p-3 sm:p-4">
                      <div className="h-4 bg-gray-400 rounded w-16 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-400 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-400 rounded w-3/4 mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h2>
          <button
            onClick={() => router.push("/dashboard/admin/exams")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back to exams
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = exam.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  const totalDuration = exam.sections.reduce((sum, sec) => sum + (sec.durationMin || 0), 0);

  const parseInstruction = (instruction: string | null) => {
    if (!instruction) return { text: "", passage: null, audio: null };
    try {
      return JSON.parse(instruction);
    } catch {
      return { text: instruction, passage: null, audio: null };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <button
          onClick={() => router.push("/dashboard/admin/exams")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Exams
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-900">{exam.title}</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Created by {exam.createdBy.name || exam.createdBy.email} • {new Date(exam.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleActive}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-2 ${
                exam.isActive
                  ? "text-orange-700 bg-orange-50 hover:bg-orange-100"
                  : "text-green-700 bg-green-50 hover:bg-green-100"
              }`}
            >
              {exam.isActive ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
            <button
              onClick={() => router.push(`/dashboard/admin/exams/${examId}/edit`)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-semibold text-gray-900">{exam.category}</p>
              {exam.track && (
                <p className="text-xs text-gray-500">Track: {exam.track}</p>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="font-semibold text-gray-900">{totalQuestions}</p>
              <p className="text-xs text-gray-500">{exam.sections.length} sections</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Duration</p>
              <p className="font-semibold text-gray-900">{totalDuration} min</p>
              <p className="text-xs text-gray-500">{exam._count.bookings} bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6 sm:mb-8">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
          exam.isActive
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}>
          {exam.isActive ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Inactive
            </>
          )}
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">Sections</h2>
        {exam.sections.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No sections in this exam</p>
            <p className="text-sm text-gray-500">Add sections to get started</p>
          </div>
        ) : (
          exam.sections.map((section, sIdx) => {
            const instructionData = parseInstruction(section.instruction);
            return (
              <div key={section.id} className="bg-white border border-gray-200 rounded-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Section {sIdx + 1}: {section.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                        {section.type}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {section.questions.length} {section.questions.length === 1 ? "question" : "questions"}
                      </span>
                    </div>
                    {instructionData.text && (
                      <p className="text-sm text-gray-600">{instructionData.text}</p>
                    )}
                    {instructionData.passage && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-2">Reading Passage:</p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {instructionData.passage}
                        </p>
                      </div>
                    )}
                    {instructionData.audio && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">🎧 Audio Preview (Teacher Mode):</p>
                        <AudioPlayer 
                          src={instructionData.audio}
                          className="max-w-2xl"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {section.durationMin} min
                  </div>
                </div>

                {/* Questions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Questions</h4>
                  {section.questions.length === 0 ? (
                    <p className="text-sm text-gray-500">No questions in this section</p>
                  ) : (
                    <div className="space-y-3">
                      {section.questions.map((question, qIdx) => (
                        <div key={question.id} className="border border-gray-200 rounded-md p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Q{qIdx + 1}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                                {question.qtype}
                              </span>
                              <span className="text-xs text-gray-500">
                                {question.maxScore} {question.maxScore === 1 ? "point" : "points"}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            {question.qtype === "ORDER_SENTENCE" ? (
                              <div>
                                <p className="font-medium mb-2">Tokens (in correct order):</p>
                                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                                  {Array.isArray(question.prompt?.tokens) && question.prompt.tokens.map((token: string, idx: number) => (
                                    <li key={idx}>{token}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : typeof question.prompt === "object" && question.prompt.text ? (
                              question.prompt.text
                            ) : typeof question.prompt === "string" ? (
                              question.prompt
                            ) : (
                              JSON.stringify(question.prompt)
                            )}
                          </div>
                          {question.options && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="font-medium text-gray-700 mb-1">Options:</p>
                              {question.qtype === "MCQ_SINGLE" || question.qtype === "MCQ_MULTI" || question.qtype === "INLINE_SELECT" ? (
                                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                                  {Array.isArray(question.options.choices) && question.options.choices.map((choice: string, idx: number) => (
                                    <li key={idx}>{choice}</li>
                                  ))}
                                </ul>
                              ) : question.qtype === "DND_GAP" ? (
                                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                                  {Array.isArray(question.options.bank) && question.options.bank.map((word: string, idx: number) => (
                                    <li key={idx}>{word}</li>
                                  ))}
                                </ul>
                              ) : (
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(question.options, null, 2)}</pre>
                              )}
                            </div>
                          )}
                          {question.answerKey && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                              <p className="font-medium text-gray-700 mb-1">Correct Answer:</p>
                              {question.qtype === "TF" ? (
                                <span className="text-gray-600">{question.answerKey.value ? "True" : "False"}</span>
                              ) : question.qtype === "MCQ_SINGLE" || question.qtype === "INLINE_SELECT" ? (
                                <span className="text-gray-600">
                                  Option {question.answerKey.index !== undefined ? question.answerKey.index + 1 : "N/A"}: {
                                    Array.isArray(question.options?.choices) && question.answerKey.index !== undefined
                                      ? question.options.choices[question.answerKey.index] || "N/A"
                                      : "N/A"
                                  }
                                </span>
                              ) : question.qtype === "MCQ_MULTI" ? (
                                <div className="text-gray-600">
                                  {Array.isArray(question.answerKey.indices) && question.answerKey.indices.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-0.5">
                                      {question.answerKey.indices.map((idx: number) => (
                                        <li key={idx}>
                                          Option {idx + 1}: {Array.isArray(question.options?.choices) ? question.options.choices[idx] || "N/A" : "N/A"}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span>No answers selected</span>
                                  )}
                                </div>
                              ) : question.qtype === "GAP" ? (
                                <span className="text-gray-600">
                                  {Array.isArray(question.answerKey.answers) ? question.answerKey.answers.join(", ") : "N/A"}
                                </span>
                              ) : question.qtype === "ORDER_SENTENCE" ? (
                                <div className="text-gray-600">
                                  <p className="mb-1">Order: {Array.isArray(question.answerKey.order) ? question.answerKey.order.join(" → ") : "N/A"}</p>
                                  {Array.isArray(question.prompt?.tokens) && Array.isArray(question.answerKey.order) && (
                                    <ol className="list-decimal list-inside space-y-0.5 mt-1">
                                      {question.answerKey.order.map((idx: number) => (
                                        <li key={idx}>{question.prompt.tokens[idx]}</li>
                                      ))}
                                    </ol>
                                  )}
                                </div>
                              ) : (
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(question.answerKey, null, 2)}</pre>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

