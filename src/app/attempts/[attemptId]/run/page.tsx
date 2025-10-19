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
import AudioPlayer from "@/components/audio/AudioPlayer";
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Tabs - Sidebar on desktop, horizontal on mobile */}
          <div className="lg:w-64 flex-shrink-0">
             <div className="rounded-xl shadow-sm border p-4 sticky top-24 flex flex-col h-[calc(100vh-8rem)]"
                  style={{
                    backgroundColor: 'rgba(48, 51, 128, 0.01)',
                    borderColor: 'rgba(48, 51, 128, 0.1)'
                  }}>
              {/* Exam Info - Top */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold mb-1 truncate" title={data.examTitle}
                    style={{ color: 'rgba(48, 51, 128, 0.9)' }}>
                  {data.examTitle}
                </h2>
                <p className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>Exam Sections</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1"
                       style={{ color: 'rgba(48, 51, 128, 0.7)' }}>
                    <span>Progress</span>
                    <span>
                      {Object.values(answers).reduce((total, sectionAnswers) => 
                        total + Object.keys(sectionAnswers).length, 0
                      )} / {data.sections?.reduce((total, section) => total + section.questions.length, 0)} questions
                    </span>
                  </div>
                   <div className="w-full rounded-full h-2"
                        style={{ backgroundColor: 'rgba(48, 51, 128, 0.1)' }}>
                     <div 
                       className="h-2 rounded-full transition-all duration-300"
                       style={{
                         backgroundColor: '#303380',
                         width: `${(Object.values(answers).reduce((total, sectionAnswers) => 
                           total + Object.keys(sectionAnswers).length, 0
                         ) / (data.sections?.reduce((total, section) => total + section.questions.length, 0) || 1)) * 100}%`
                       }}
                     ></div>
                   </div>
                </div>
              </div>

               {/* Sections List - Middle */}
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <style jsx>{`
                   .custom-scrollbar {
                     scrollbar-width: thin;
                     scrollbar-color: #cbd5e1 #f1f5f9;
                   }
                   .custom-scrollbar::-webkit-scrollbar {
                     width: 4px;
                   }
                   .custom-scrollbar::-webkit-scrollbar-track {
                     background: transparent;
                   }
                   .custom-scrollbar::-webkit-scrollbar-thumb {
                     background: #cbd5e1;
                     border-radius: 2px;
                   }
                   .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                     background: #94a3b8;
                   }
                 `}</style>
                 <div className="space-y-2 pr-1">
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
                             ? "border"
                             : "border border-transparent"
                         }`}
                         style={isActive ? { 
                           backgroundColor: '#E0E1EC',
                           borderColor: 'rgba(48, 51, 128, 0.2)',
                           color: '#303380'
                         } : {
                           backgroundColor: 'rgba(48, 51, 128, 0.02)',
                           borderColor: 'rgba(48, 51, 128, 0.1)',
                           color: 'rgba(48, 51, 128, 0.8)'
                         }}
                         onMouseEnter={(e) => {
                           if (!isActive) {
                             e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                             e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                           }
                         }}
                         onMouseLeave={(e) => {
                           if (!isActive) {
                             e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                             e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.1)';
                           }
                         }}
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
                         <div className="mt-1 text-xs"
                              style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
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
                   className="w-full px-4 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                   style={{ backgroundColor: '#303380' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = '#252a6b';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = '#303380';
                   }}
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
              <div className="bg-white rounded-xl mt-1 shadow-sm border border-slate-200 p-6">
                 <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{currentSection.title}</h2>
                 </div>

                 {/* Audio Player for Listening Section */}
                 {currentSection.type === 'LISTENING' && (
                   <div className="mb-6">
                     <AudioPlayer 
                       src="/audio/listening-sample.mp3" 
                       className="max-w-md mx-auto"
                     />
                    </div>
                  )}

                <div className="space-y-6">
                  {currentSection?.questions?.map((q, idx) => {
                    const value = answers[currentSection.type]?.[q.id];
                    const isLocked = lockedSections.has(currentSection.type);

                    return (
                      <div
                        key={q.id}
                         className="p-5 border rounded-lg transition-all duration-200"
                         style={{
                           backgroundColor: 'rgba(48, 51, 128, 0.02)',
                           borderColor: 'rgba(48, 51, 128, 0.1)'
                         }}
                         onMouseEnter={(e) => {
                           e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                           e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                           e.currentTarget.style.boxShadow = '0 1px 3px rgba(48, 51, 128, 0.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                           e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.1)';
                           e.currentTarget.style.boxShadow = 'none';
                         }}
                      >
                        <div className="flex items-start gap-3">
                           <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                                style={{ 
                                  backgroundColor: 'rgba(48, 51, 128, 0.1)',
                                  color: '#303380'
                                }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            {/* Question Prompt */}
                            {q.prompt?.passage && (
                               <div className="mb-3 p-4 rounded-lg"
                                    style={{
                                      backgroundColor: 'rgba(48, 51, 128, 0.05)',
                                      borderColor: 'rgba(48, 51, 128, 0.15)',
                                      border: '1px solid'
                                    }}>
                                <p className="text-sm text-slate-700 italic">{q.prompt.passage}</p>
                              </div>
                            )}
                            {q.prompt?.transcript && (
                               <div className="mb-3 p-4 rounded-lg"
                                    style={{
                                      backgroundColor: 'rgba(48, 51, 128, 0.05)',
                                      borderColor: 'rgba(48, 51, 128, 0.15)',
                                      border: '1px solid'
                                    }}>
                                 <p className="text-xs font-medium mb-1" style={{ color: '#303380' }}>🎧 Transcript:</p>
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
