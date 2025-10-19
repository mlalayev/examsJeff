"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Loader2,
  Lock,
  Save,
  Send
} from "lucide-react";
import Loading from "@/components/loading/Loading";
import {
  QTF,
  QMcqSingle,
  QMcqMulti,
  QSelect,
  QGap,
  QOrderSentence,
  QDndGap,
} from "@/components/questions";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  order: number;
  status?: string;
}

interface AttemptData {
  id: string;
  examTitle: string;
  status: string;
  sections: Section[];
  savedAnswers: Record<string, Record<string, any>>;
}

export default function AttemptRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [data, setData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      
      console.log("Attempt data:", json);
      setData(json);
      setAnswers(json.savedAnswers || {});
      
      // Set first section as active
      if (json.sections && json.sections.length > 0) {
        setActiveSection(json.sections[0].type);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load exam");
      router.push("/dashboard/student/exams");
    } finally {
      setLoading(false);
    }
  };

  const saveSection = useCallback(
    async (sectionType: string, answersToSave: Record<string, any>) => {
      setSaving(sectionType);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType,
            answers: answersToSave,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to save");
        setLastSaved(new Date());
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(null);
      }
    },
    [attemptId]
  );

  const setAnswer = (sectionType: string, questionId: string, value: any) => {
    if (lockedSections.has(sectionType)) return;

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [sectionType]: { ...(prev[sectionType] || {}), [questionId]: value },
      };

      // Debounced autosave (8 seconds)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        saveSection(sectionType, newAnswers[sectionType]);
      }, 8000);

      return newAnswers;
    });
  };

  const handleEndSection = async (sectionType: string) => {
    if (!confirm(`Are you sure you want to end the ${sectionType} section? You won't be able to edit it after.`)) {
      return;
    }

    // Save current answers first
    await saveSection(sectionType, answers[sectionType] || {});
    
    // Lock section
    setLockedSections((prev) => new Set([...prev, sectionType]));
  };

  const handleSubmit = async () => {
    if (!confirm("Submit your exam? You cannot change answers after submission.")) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit");

      alert("Exam submitted successfully!");
      router.push(`/attempts/${attemptId}/results`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionComponent = (q: Question, value: any, onChange: (v: any) => void, readOnly: boolean) => {
    const props = { question: q, value, onChange, readOnly };

    switch (q.qtype) {
      case "TF":
        return <QTF {...props} />;
      case "MCQ_SINGLE":
        return <QMcqSingle {...props} />;
      case "MCQ_MULTI":
        return <QMcqMulti {...props} />;
      case "SELECT":
        return <QSelect {...props} />;
      case "GAP":
        return <QGap {...props} />;
      case "ORDER_SENTENCE":
        return <QOrderSentence {...props} />;
      case "DND_GAP":
        return <QDndGap {...props} />;
      case "SHORT_TEXT":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50"
            placeholder="Write your answer"
          />
        );
      case "ESSAY":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 min-h-[150px] disabled:bg-gray-50"
            placeholder="Write your essay here"
          />
        );
      default:
        return <div className="text-sm text-gray-500">Unsupported question type: {q.qtype}</div>;
    }
  };

  const getShortSectionTitle = (title: string) => {
    const shortTitles: Record<string, string> = {
      'READING': 'Reading',
      'LISTENING': 'Listening', 
      'WRITING': 'Writing',
      'SPEAKING': 'Speaking',
      'GRAMMAR': 'Grammar',
      'VOCABULARY': 'Vocabulary',
      'Reading Comprehension': 'Reading',
      'Listening Comprehension': 'Listening',
      'Writing Task': 'Writing',
      'Speaking Task': 'Speaking',
      'Grammar Exercise': 'Grammar',
      'Vocabulary Test': 'Vocabulary',
      'Reading Section': 'Reading',
      'Listening Section': 'Listening',
      'Writing Section': 'Writing',
      'Speaking Section': 'Speaking',
      'Grammar Section': 'Grammar',
      'Vocabulary Section': 'Vocabulary'
    };
    
    return shortTitles[title] || title.substring(0, 10) + (title.length > 10 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" variant="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Exam not found</p>
      </div>
    );
  }

  if (!data.sections || data.sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No sections found for this exam</p>
          <p className="text-sm text-gray-400">Please contact your teacher</p>
        </div>
      </div>
    );
  }

  const currentSection = data.sections?.find((s) => s.type === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Tabs - Sidebar on desktop, horizontal on mobile */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-24 flex flex-col h-[calc(100vh-8rem)]">
              {/* Exam Info - Top */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-1 truncate" title={data.examTitle}>
                  {data.examTitle}
                </h2>
                <p className="text-xs text-slate-500">Exam Sections</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {Object.values(answers).reduce((total, sectionAnswers) => 
                        total + Object.keys(sectionAnswers).length, 0
                      )} / {data.sections?.reduce((total, section) => total + section.questions.length, 0)} questions
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.values(answers).reduce((total, sectionAnswers) => 
                          total + Object.keys(sectionAnswers).length, 0
                        ) / (data.sections?.reduce((total, section) => total + section.questions.length, 0) || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Sections List - Middle */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
                <style jsx>{`
                  .scrollbar-thin {
                    scrollbar-width: thin;
                  }
                  .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                    transition: background 0.2s ease;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                  .scrollbar-thin::-webkit-scrollbar-thumb:active {
                    background: #64748b;
                  }
                `}</style>
                <div className="space-y-2 pr-2">
                  {data.sections?.map((section) => {
                    const isActive = activeSection === section.type;
                    const isLocked = lockedSections.has(section.type);
                    const answeredCount = Object.keys(answers[section.type] || {}).length;
                    const totalCount = section.questions.length;

                    return (
                      <button
                        key={section.type}
                        onClick={() => setActiveSection(section.type)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-700"
                            : "bg-slate-50 hover:bg-slate-100 border border-transparent text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            {isLocked ? (
                              <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <BookOpen className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm truncate" title={section.title}>
                              {getShortSectionTitle(section.title)}
                            </span>
                          </div>
                          {isLocked && (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {answeredCount}/{totalCount} answered
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button - Bottom */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <Loading size="sm" variant="dots" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Exam
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  You cannot change answers after submission
                </p>
              </div>
            </div>
          </div>

          {/* Questions Area */}
          <div className="flex-1">
            {currentSection && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
                  {!lockedSections.has(currentSection.type) && (
                    <button
                      onClick={() => handleEndSection(currentSection.type)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      End Section
                    </button>
                  )}
                  {lockedSections.has(currentSection.type) && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-medium">Section Locked</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {currentSection?.questions?.map((q, idx) => {
                    const value = answers[currentSection.type]?.[q.id];
                    const isLocked = lockedSections.has(currentSection.type);

                    return (
                      <div
                        key={q.id}
                        className="p-5 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            {/* Question Prompt */}
                            {q.prompt?.passage && (
                              <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-slate-700 italic">{q.prompt.passage}</p>
                              </div>
                            )}
                            {q.prompt?.transcript && (
                              <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-700 font-medium mb-1">🎧 Transcript:</p>
                                <p className="text-sm text-slate-700">{q.prompt.transcript}</p>
                              </div>
                            )}
                            <p className="text-slate-900 font-medium mb-3">
                              {q.prompt?.text || "Question"}
                            </p>

                            {/* Question Component */}
                            {renderQuestionComponent(
                              q,
                              value,
                              (v) => setAnswer(currentSection.type, q.id, v),
                              isLocked
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
