"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingSkeleton } from "@/components/attempts/LoadingSkeleton";
import { ExamSidebar } from "@/components/attempts/ExamSidebar";
import { QuestionsArea } from "@/components/attempts/QuestionsArea";
import { QOpenText } from "@/components/questions/QOpenText";
import { QMcqSingle } from "@/components/questions/QMcqSingle";
import { QMcqMulti } from "@/components/questions/QMcqMulti";
import { QTF } from "@/components/questions/QTF";
import { QInlineSelect } from "@/components/questions/QInlineSelect";
import { QDndGap } from "@/components/questions/QDndGap";
import { QOrderSentence } from "@/components/questions/QOrderSentence";

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
  audio?: string | null;
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
  const [activeSection, setActiveSection] = useState<string>(""); // Now stores section.id
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>(
    {} // Key is section.id now
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set()); // Now stores section.id
  const [wordBankPositions, setWordBankPositions] = useState<
    Record<string, number>
  >({});
  const [draggedOptions, setDraggedOptions] = useState<
    Record<string, string | null>
  >({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      
      setData(json);
      
      // Convert savedAnswers from section.type to section.id
      if (json.savedAnswers && json.sections) {
        const convertedAnswers: Record<string, Record<string, any>> = {};
        json.sections.forEach((section: Section) => {
          if (json.savedAnswers[section.type]) {
            convertedAnswers[section.id] = json.savedAnswers[section.type];
          }
        });
        setAnswers(convertedAnswers);
      }

      if (json.sections && json.sections.length > 0) {
        setActiveSection(json.sections[0].id);
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
    async (sectionId: string, answersToSave: Record<string, any>) => {
      if (!data?.sections) return;
      const section = data.sections.find(s => s.id === sectionId);
      if (!section) return;
      
      setSaving(sectionId);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType: section.type, // API still expects type
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
    [attemptId, data?.sections]
  );

  const setAnswer = (sectionId: string, questionId: string, value: any) => {
    if (lockedSections.has(sectionId)) return;

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [sectionId]: { ...(prev[sectionId] || {}), [questionId]: value },
      };

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        saveSection(sectionId, newAnswers[sectionId]);
      }, 3000);

      return newAnswers;
    });
  };

  const handleEndSection = async (sectionId: string) => {
    if (!data?.sections) return;
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    if (
      !confirm(
        `Are you sure you want to end the "${section.title}" section? You won't be able to edit it after.`
      )
    ) {
      return;
    }

    await saveSection(sectionId, answers[sectionId] || {});
    setLockedSections((prev) => new Set([...prev, sectionId]));
  };

  const handleSubmitClick = async () => {
    setShowSubmitModal(true);
  };

  const handleSubmitConfirm = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const savePromises = Object.keys(answers).map((sectionId) =>
        saveSection(sectionId, answers[sectionId] || {})
      );
      await Promise.all(savePromises);
      
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Submit error response:", json);
        const errorMsg = json.details
          ? `${json.error}: ${json.details}`
          : json.error || "Failed to submit";
        throw new Error(errorMsg);
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Submit error:", err);
      alert(err.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push(`/attempts/${attemptId}/results`);
  };

  const renderQuestionComponent = useCallback(
    (
      q: Question,
      value: any,
      onChange: (v: any) => void,
      readOnly: boolean,
      showWordBank?: boolean,
      externalDraggedOption?: string | null,
      onDropComplete?: () => void
    ) => {
      const props = {
        question: q,
        value,
        onChange,
        readOnly,
        showWordBank,
        externalDraggedOption,
        onDropComplete,
      };

    switch (q.qtype) {
      case "MCQ_SINGLE":
        return <QMcqSingle {...props} />;
      case "MCQ_MULTI":
        return <QMcqMulti {...props} />;
      case "TF":
        return <QTF {...props} />;
      case "INLINE_SELECT":
        return <QInlineSelect {...props} />;
      case "ORDER_SENTENCE":
        return <QOrderSentence {...props} />;
       case "DND_GAP":
         return <QDndGap {...props} />;
        case "GAP": // Legacy support - treat as SHORT_TEXT
       case "SHORT_TEXT":
         return <QOpenText {...props} />;
       case "ESSAY":
         return (
           <textarea
             value={value || ""}
             onChange={(e) => onChange(e.target.value)}
             disabled={readOnly}
              className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 min-h-[200px] disabled:bg-gray-50 resize-y"
              placeholder="Write your essay here..."
           />
         );
       default:
    return (
            <div className="text-sm text-gray-500">
              Unsupported question type: {q.qtype}
      </div>
    );
  }
    },
    []
  );

  const getShortSectionTitle = useCallback((title: string) => {
    const shortTitles: Record<string, string> = {
      READING: "Reading",
      LISTENING: "Listening",
      WRITING: "Writing",
      SPEAKING: "Speaking",
      GRAMMAR: "Grammar",
      VOCABULARY: "Vocabulary",
      "Reading Comprehension": "Reading",
      "Listening Comprehension": "Listening",
      "Writing Task": "Writing",
      "Speaking Task": "Speaking",
      "Grammar Exercise": "Grammar",
      "Vocabulary Test": "Vocabulary",
      "Reading Section": "Reading",
      "Listening Section": "Listening",
      "Writing Section": "Writing",
      "Speaking Section": "Speaking",
      "Grammar Section": "Grammar",
      "Vocabulary Section": "Vocabulary",
    };

    return (
      shortTitles[title] ||
      title.substring(0, 10) + (title.length > 10 ? "..." : "")
    );
  }, []);

  // Helper function to count answered questions
  const countAnsweredForQuestion = useCallback(
    (q: Question, answer: any): number => {
                          if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
                            const text = q.prompt.textWithBlanks;
                            let sentences: string[] = [];
        if (text.includes("\n")) {
          sentences = text.split("\n").filter((line: string) => line.trim());
        } else if (text.includes("1.") && text.includes("2.")) {
          sentences = text
            .split(/(?=\d+\.\s)/)
            .filter((line: string) => line.trim());
                            } else {
          sentences = text
            .split(/(?<=\.)\s+(?=[A-Z])/)
            .filter((line: string) => line.trim());
                            }
                            
                            if (answer && typeof answer === "object" && !Array.isArray(answer)) {
                              let answeredBlanks = 0;
                              sentences.forEach((sentence, sentenceIdx) => {
            const blanksInSentence =
              sentence.split(/___+|________+/).length - 1;
                                const sentenceAnswers = answer[sentenceIdx.toString()];
                                if (Array.isArray(sentenceAnswers)) {
                                  for (let blankIdx = 0; blankIdx < blanksInSentence; blankIdx++) {
                                    const blankAnswer = sentenceAnswers[blankIdx];
                if (
                  blankAnswer !== undefined &&
                  blankAnswer !== null &&
                  blankAnswer !== ""
                ) {
                                      answeredBlanks++;
                                    }
                                  }
                                }
                              });
          return answeredBlanks;
                            }
        return 0;
                          } else {
        if (answer === null || answer === undefined || answer === "") return 0;
                            if (typeof answer === "object") {
                              if (Array.isArray(answer)) {
            return answer.length > 0 ? 1 : 0;
          }
          return Object.keys(answer).length > 0 ? 1 : 0;
        }
        return 1;
      }
    },
    []
  );

  // Helper function to count total questions
  const countTotalForQuestion = useCallback((q: Question): number => {
                            if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
                              const text = q.prompt.textWithBlanks;
                              let sentences: string[] = [];
      if (text.includes("\n")) {
        sentences = text.split("\n").filter((line: string) => line.trim());
      } else if (text.includes("1.") && text.includes("2.")) {
        sentences = text
          .split(/(?=\d+\.\s)/)
          .filter((line: string) => line.trim());
                              } else {
        sentences = text
          .split(/(?<=\.)\s+(?=[A-Z])/)
          .filter((line: string) => line.trim());
                              }
                              
                              let totalBlanks = 0;
      sentences.forEach((sentence) => {
                                const blanksInSentence = sentence.split(/___+|________+/).length - 1;
                                totalBlanks += blanksInSentence;
                              });
      return totalBlanks > 0 ? totalBlanks : 1;
    }
    return 1;
  }, []);

  // Memoized progress calculations
  const progressStats = useMemo(() => {
    if (!data?.sections) return { answered: 0, total: 0, percentage: 0 };

    let answered = 0;
    let total = 0;

    data.sections.forEach((section) => {
      const sectionAnswers = answers[section.id] || {};
      section.questions.forEach((q) => {
        const answer = sectionAnswers[q.id];
        answered += countAnsweredForQuestion(q, answer);
        total += countTotalForQuestion(q);
      });
    });

    return {
      answered,
      total,
      percentage: total > 0 ? (answered / total) * 100 : 0,
    };
  }, [
    data?.sections,
    answers,
    countAnsweredForQuestion,
    countTotalForQuestion,
  ]);

  // Memoized section stats
  const sectionStats = useMemo(() => {
    if (!data?.sections) return {};

    const stats: Record<string, { answered: number; total: number }> = {};

    data.sections.forEach((section) => {
      const sectionAnswers = answers[section.id] || {};
      let answered = 0;
      let total = 0;

      section.questions.forEach((q) => {
        const answer = sectionAnswers[q.id];
        answered += countAnsweredForQuestion(q, answer);
        total += countTotalForQuestion(q);
      });

      stats[section.id] = { answered, total };
    });

    return stats;
  }, [
    data?.sections,
    answers,
    countAnsweredForQuestion,
    countTotalForQuestion,
  ]);

  const handleSectionClick = useCallback(
    async (sectionId: string) => {
                        if (activeSection && answers[activeSection]) {
                          await saveSection(activeSection, answers[activeSection]);
                        }
      setActiveSection(sectionId);
    },
    [activeSection, answers, saveSection]
  );

  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      if (!data?.sections) return;
      const currentSection = data.sections.find(
        (s) => s.id === activeSection
      );
      if (currentSection) {
        setAnswer(currentSection.id, questionId, value);
      }
    },
    [activeSection, data?.sections]
  );

  const handleWordBankPositionChange = useCallback(
    (questionId: string, position: number) => {
      setWordBankPositions((prev) => ({
        ...prev,
        [questionId]: position,
      }));
    },
    []
  );

  const handleDragStart = useCallback(
    (questionId: string, label: string, e: React.DragEvent) => {
      if (!data?.sections) return;
      const currentSection = data.sections.find(
        (s) => s.id === activeSection
      );
      if (currentSection && lockedSections.has(currentSection.id)) return;

      setDraggedOptions((prev) => ({
                                                   ...prev,
        [questionId]: label,
      }));
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", label);
    },
    [activeSection, data?.sections, lockedSections]
  );

  const handleDragEnd = useCallback((questionId: string) => {
    setDraggedOptions((prev) => ({
                                                   ...prev,
      [questionId]: null,
    }));
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
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

  const currentSection = data.sections.find((s) => s.id === activeSection);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
        <div className="flex flex-col lg:flex-row gap-6">
            <ExamSidebar
              examTitle={data.examTitle}
              sections={data.sections}
              activeSection={activeSection}
              lockedSections={lockedSections}
              progressStats={progressStats}
              sectionStats={sectionStats}
              submitting={submitting}
              onSectionClick={handleSectionClick}
              onSubmit={handleSubmitClick}
              getShortSectionTitle={getShortSectionTitle}
            />

            {currentSection && (
              <QuestionsArea
                section={currentSection}
                answers={answers}
                isLocked={lockedSections.has(currentSection.id)}
                wordBankPositions={wordBankPositions}
                draggedOptions={draggedOptions}
                onAnswerChange={handleAnswerChange}
                onWordBankPositionChange={handleWordBankPositionChange}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                renderQuestionComponent={renderQuestionComponent}
              />
            )}
                   </div>
                </div>
              </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmitModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Submit Exam
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Confirm your submission
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to submit your exam? You cannot change your answers after submission.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitConfirm}
                className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ backgroundColor: "#303380" }}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleSuccessModalClose();
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Content */}
            <div className="px-6 py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Exam Submitted Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Your exam has been submitted. Click below to view your results.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleSuccessModalClose}
                className="w-full px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ backgroundColor: "#303380" }}
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}
                             </>
  );
}
