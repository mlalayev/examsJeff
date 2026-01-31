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
import { SectionTimer } from "@/components/attempts/SectionTimer";
import { useAttemptPersistence, type PersistedAttemptState } from "@/hooks/useAttemptPersistence";
import { X } from "lucide-react";

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
  durationMin: number;
  questions: Question[];
  order: number;
  status?: string;
  audio?: string | null;
}

interface AttemptData {
  id: string;
  examTitle: string;
  examCategory?: string;
  status: string;
  sections: Section[];
  savedAnswers: Record<string, Record<string, any>>;
  sectionStartTimes?: Record<string, number>;
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
  const [accessedSections, setAccessedSections] = useState<Set<string>>(new Set());
  const [sectionStartTimes, setSectionStartTimes] = useState<Record<string, number>>({});
  const [wordBankPositions, setWordBankPositions] = useState<
    Record<string, number>
  >({});
  const [draggedOptions, setDraggedOptions] = useState<
    Record<string, string | null>
  >({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResumeNotification, setShowResumeNotification] = useState(false);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredFromPersistence = useRef(false);

  // Persistence hook - auto-saves state to localStorage
  const { clearStorage: clearPersistence } = useAttemptPersistence({
    attemptId,
    moduleType: data?.examCategory,
    answers,
    activeSection,
    sectionStartTimes,
    lockedSections,
    isSubmitted: submitting || showSuccessModal,
    onRestore: (restored: PersistedAttemptState) => {
      // Only restore once
      if (hasRestoredFromPersistence.current) return;
      hasRestoredFromPersistence.current = true;

      // Restore answers
      if (restored.answers && Object.keys(restored.answers).length > 0) {
        setAnswers(restored.answers);
      }

      // Restore active section
      if (restored.activeSection) {
        setActiveSection(restored.activeSection);
      }

      // Restore section start times
      if (restored.sectionStartTimes) {
        setSectionStartTimes(restored.sectionStartTimes);
      }

      // Restore locked sections
      if (restored.lockedSections) {
        setLockedSections(new Set(restored.lockedSections));
      }

      // Show notification
      setShowResumeNotification(true);
      setTimeout(() => setShowResumeNotification(false), 5000);
    },
  });

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const getLocalStorageKey = (attemptId: string) => {
    return `exam_answers_${attemptId}`;
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      
      setData(json);
      
      // Load answers from localStorage first (if exists)
      let loadedAnswers: Record<string, Record<string, any>> = {};
      if (typeof window !== "undefined") {
        const storageKey = getLocalStorageKey(attemptId);
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) {
          try {
            loadedAnswers = JSON.parse(savedAnswers);
          } catch (e) {
            console.error("Failed to parse saved answers from localStorage:", e);
            localStorage.removeItem(storageKey);
          }
        }
      }
      
      // Convert savedAnswers from section.type to section.id (from server)
      if (json.savedAnswers && json.sections) {
        const convertedAnswers: Record<string, Record<string, any>> = {};
        json.sections.forEach((section: Section) => {
          if (json.savedAnswers[section.type]) {
            convertedAnswers[section.id] = json.savedAnswers[section.type];
          }
        });
        
        // Merge: localStorage takes priority, but merge with server data
        Object.keys(convertedAnswers).forEach((sectionId) => {
          if (!loadedAnswers[sectionId]) {
            loadedAnswers[sectionId] = convertedAnswers[sectionId];
          } else {
            // Merge: keep localStorage answers, but add any new questions from server
            loadedAnswers[sectionId] = {
              ...convertedAnswers[sectionId],
              ...loadedAnswers[sectionId],
            };
          }
        });
      }
      
      setAnswers(loadedAnswers);
      
      // Save merged answers back to localStorage
      if (typeof window !== "undefined" && Object.keys(loadedAnswers).length > 0) {
        const storageKey = getLocalStorageKey(attemptId);
        localStorage.setItem(storageKey, JSON.stringify(loadedAnswers));
      }

      // Load section start times
      let finalStartTimes = json.sectionStartTimes || {};
      const restoredAccessedSections = new Set<string>();

      // Load timer data from localStorage for SAT exams
      if (json.examCategory === "SAT" && typeof window !== "undefined") {
        const restoredStartTimes: Record<string, number> = {};
        json.sections.forEach((section: Section) => {
          const storageKey = `sat_timer_${attemptId}_${section.id}`;
          const savedTimer = localStorage.getItem(storageKey);
          if (savedTimer) {
            try {
              const { startTime, endTime } = JSON.parse(savedTimer);
              const now = Date.now();
              
              // Check if timer is still valid (not expired)
              if (endTime && now < endTime && startTime) {
                restoredStartTimes[section.id] = startTime;
                restoredAccessedSections.add(section.id);
              } else {
                // Timer expired, remove from localStorage
                localStorage.removeItem(storageKey);
              }
            } catch (e) {
              console.error("Failed to parse saved timer:", e);
              localStorage.removeItem(storageKey);
            }
          }
        });
        
        // Merge with server data (localStorage takes priority)
        finalStartTimes = { ...finalStartTimes, ...restoredStartTimes };
      }

      setSectionStartTimes(finalStartTimes);
      setAccessedSections(restoredAccessedSections);

      if (json.sections && json.sections.length > 0) {
        const firstSection = json.sections[0];
        setActiveSection(firstSection.id);
        setAccessedSections((prev) => new Set([...prev, firstSection.id]));
        // Start timer for first section if SAT
        if (json.examCategory === "SAT" && !finalStartTimes[firstSection.id]) {
          const storageKey = `sat_timer_${attemptId}_${firstSection.id}`;
          const hasTimer = typeof window !== "undefined" && localStorage.getItem(storageKey);
          if (!hasTimer) {
            const newStartTimes = {
              ...finalStartTimes,
              [firstSection.id]: Date.now(),
            };
            setSectionStartTimes(newStartTimes);
            // Save start time
            fetch(`/api/attempts/${attemptId}/save`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sectionStartTimes: newStartTimes,
              }),
            });
          }
        }
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
    // SAT üçün locked section-larda dəyişiklik etmək olmaz
    if (lockedSections.has(sectionId)) return;

    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [sectionId]: { ...(prev[sectionId] || {}), [questionId]: value },
      };

      // Save to localStorage immediately
      if (typeof window !== "undefined") {
        const storageKey = getLocalStorageKey(attemptId);
        localStorage.setItem(storageKey, JSON.stringify(newAnswers));
      }

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        saveSection(sectionId, newAnswers[sectionId]);
      }, 3000);

      return newAnswers;
    });
  };

  const handleTimeExpired = useCallback(async (sectionId: string) => {
    // Clear timer from localStorage
    if (typeof window !== "undefined") {
      const storageKey = `sat_timer_${attemptId}_${sectionId}`;
      localStorage.removeItem(storageKey);
    }

    // Auto-save and lock the section
    await saveSection(sectionId, answers[sectionId] || {});
    setLockedSections((prev) => new Set([...prev, sectionId]));

    alert("Time's up for this module! Your answers have been auto-saved and the module is now locked.");

    // SAT üçün avtomatik növbəti modula keçid
    if (data?.examCategory === "SAT" && data?.sections) {
      const currentIndex = data.sections.findIndex((s) => s.id === sectionId);
      if (currentIndex < data.sections.length - 1) {
      const nextSection = data.sections[currentIndex + 1];
      
      // Clear old timer from localStorage for next section
      if (typeof window !== "undefined") {
        const nextStorageKey = `sat_timer_${attemptId}_${nextSection.id}`;
        localStorage.removeItem(nextStorageKey);
      }
      
      // Always start new timer for next section
      const newStartTime = Date.now();
      const newStartTimes = {
        ...sectionStartTimes,
        [nextSection.id]: newStartTime,
      };
      setSectionStartTimes(newStartTimes);
      setAccessedSections((prev) => new Set([...prev, nextSection.id]));
      
      // Save start time
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionStartTimes: newStartTimes,
        }),
      });
      
      setActiveSection(nextSection.id);
      } else {
        // Last module
        alert("This was the last module. You can now submit the entire exam.");
      }
    } else {
      // Normal exam (non-SAT) - keep old behavior
      if (data?.sections) {
        const currentIndex = data.sections.findIndex((s) => s.id === sectionId);
        if (currentIndex < data.sections.length - 1) {
          const nextSection = data.sections[currentIndex + 1];
          setActiveSection(nextSection.id);
        }
      }
    }
  }, [answers, data, saveSection, sectionStartTimes, accessedSections, lockedSections, attemptId]);

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

  const [showSubmitModuleModal, setShowSubmitModuleModal] = useState(false);

  const handleSubmitModuleClick = () => {
    if (!data?.examCategory || data.examCategory !== "SAT") return;
    if (lockedSections.has(activeSection)) {
      alert("This module is already submitted.");
      return;
    }
    setShowSubmitModuleModal(true);
  };

  const handleSubmitModuleConfirm = async () => {
    setShowSubmitModuleModal(false);
    if (!data?.sections || !activeSection) return;

    const currentSectionIndex = data.sections.findIndex((s) => s.id === activeSection);
    if (currentSectionIndex === -1) return;

    // Save current module
    await saveSection(activeSection, answers[activeSection] || {});
    
    // Clear timer from localStorage
    if (typeof window !== "undefined") {
      const storageKey = `sat_timer_${attemptId}_${activeSection}`;
      localStorage.removeItem(storageKey);
    }
    
    // Lock current module
    setLockedSections((prev) => new Set([...prev, activeSection]));

    // Move to next module if exists
    if (currentSectionIndex < data.sections.length - 1) {
      const nextSection = data.sections[currentSectionIndex + 1];
      
      // Clear old timer from localStorage for next section
      if (typeof window !== "undefined") {
        const nextStorageKey = `sat_timer_${attemptId}_${nextSection.id}`;
        localStorage.removeItem(nextStorageKey);
      }
      
      // Always start new timer for next section
      const newStartTime = Date.now();
      const newStartTimes = {
        ...sectionStartTimes,
        [nextSection.id]: newStartTime,
      };
      setSectionStartTimes(newStartTimes);
      setAccessedSections((prev) => new Set([...prev, nextSection.id]));
      
      // Save start time
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionStartTimes: newStartTimes,
        }),
      });
      
      setActiveSection(nextSection.id);
    } else {
      // Last module - show message
      alert("This was the last module. You can now submit the entire exam.");
    }
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

      // Clear all localStorage data for this attempt
      if (typeof window !== "undefined") {
        // Clear answers
        const answersKey = getLocalStorageKey(attemptId);
        localStorage.removeItem(answersKey);
        
        // Clear all timers for this attempt
        if (data?.sections) {
          data.sections.forEach((section) => {
            const timerKey = `sat_timer_${attemptId}_${section.id}`;
            localStorage.removeItem(timerKey);
          });
        }

        // Clear persistence data
        clearPersistence();
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
      if (!data) return;

      // SAT üçün locked section-lara qayıtmaq olmaz
      if (data.examCategory === "SAT" && lockedSections.has(sectionId)) {
        alert("This module has been completed and locked. You cannot make changes.");
        return;
      }

      // SAT üçün yalnız növbəti modula keçmək olar (əvvəlki modullara yox)
      if (data.examCategory === "SAT") {
        const currentIndex = data.sections.findIndex((s) => s.id === activeSection);
        const targetIndex = data.sections.findIndex((s) => s.id === sectionId);
        
        // Əgər istifadəçi əvvəlki modula keçmək istəyirsə
        if (targetIndex < currentIndex) {
          alert("You cannot go back to previous modules in SAT exams.");
          return;
        }

        // Əgər istifadəçi cari modulu submit etmədən növbəti modula keçmək istəyirsə
        if (targetIndex > currentIndex && !lockedSections.has(activeSection)) {
          alert("Please submit the current module before moving to the next one.");
          return;
        }
      }

      // Save current section before switching
      if (activeSection && answers[activeSection]) {
        await saveSection(activeSection, answers[activeSection]);
      }

      // SAT üçün timer başlat (həmişə yenidən başlat)
      if (data.examCategory === "SAT" && !lockedSections.has(sectionId)) {
        // Clear old timer from localStorage
        if (typeof window !== "undefined") {
          const storageKey = `sat_timer_${attemptId}_${sectionId}`;
          localStorage.removeItem(storageKey);
        }
        
        // Always start new timer
        const newStartTime = Date.now();
        const newStartTimes = {
          ...sectionStartTimes,
          [sectionId]: newStartTime,
        };
        setSectionStartTimes(newStartTimes);
        setAccessedSections((prev) => new Set([...prev, sectionId]));
        
        // Save start time immediately
        await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionStartTimes: newStartTimes,
          }),
        });
      }

      setActiveSection(sectionId);
    },
    [activeSection, answers, saveSection, data, accessedSections, sectionStartTimes, lockedSections, attemptId]
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
  const isSAT = data.examCategory === "SAT";

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* SAT Timer */}
        {isSAT && currentSection && !lockedSections.has(currentSection.id) && (
          <SectionTimer
            sectionId={currentSection.id}
            durationMinutes={currentSection.durationMin || 35}
            startTime={sectionStartTimes[currentSection.id]}
            isActive={activeSection === currentSection.id}
            onTimeExpired={() => handleTimeExpired(currentSection.id)}
            attemptId={attemptId}
          />
        )}

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
              isSAT={isSAT}
              currentSectionIndex={data.sections.findIndex((s) => s.id === activeSection)}
              onSectionClick={handleSectionClick}
              onSubmit={handleSubmitClick}
              onSubmitModule={isSAT ? handleSubmitModuleClick : undefined}
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
                examCategory={data.examCategory}
                userRole="STUDENT"
              />
            )}
                   </div>
                </div>
              </div>

      {/* Resume Notification */}
      {showResumeNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-sm">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Resumed from last session</p>
              <p className="text-xs text-green-700 mt-1">Your answers and progress have been restored</p>
            </div>
            <button
              onClick={() => setShowResumeNotification(false)}
              className="flex-shrink-0 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Submit Module Modal - SAT Only */}
      {showSubmitModuleModal && isSAT && currentSection && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmitModuleModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Submit Module
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {currentSection.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Are you sure you want to submit <span className="font-semibold">{currentSection.title}</span>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ You will not be able to return to this module or change your answers after submission.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModuleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitModuleConfirm}
                className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ backgroundColor: "#059669" }}
              >
                Submit Module
              </button>
            </div>
          </div>
        </div>
      )}

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
