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
import { QTFNG } from "@/components/questions/QTFNG";
import { QInlineSelect } from "@/components/questions/QInlineSelect";
import { QDndGap } from "@/components/questions/QDndGap";
import { QOrderSentence } from "@/components/questions/QOrderSentence";
import { QFillInBlank } from "@/components/questions/QFillInBlank";
import { QSpeakingRecording } from "@/components/questions/QSpeakingRecording";
import { SectionTimer } from "@/components/attempts/SectionTimer";
import { useAttemptPersistence, type PersistedAttemptState } from "@/hooks/useAttemptPersistence";
import { SubmitModal } from "@/components/attempts/modals/SubmitModal";
import { SuccessModal } from "@/components/attempts/modals/SuccessModal";
import { SubmitModuleModal } from "@/components/attempts/modals/SubmitModuleModal";
import { ResumeNotification } from "@/components/attempts/ResumeNotification";
import { IELTSSectionChangeModal } from "@/components/attempts/modals/IELTSSectionChangeModal";
import { Clock, Save, CheckCircle, Send, ChevronRight, X } from "lucide-react";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
  image?: string | null; // Question-level image (for FILL_IN_BLANK)
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
  image?: string | null; // Section image (for IELTS Listening parts)
  introduction?: string | null; // Section introduction (for IELTS Listening parts)
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
  const [listeningPart, setListeningPart] = useState(1); // For IELTS Listening part selection
  const [readingPart, setReadingPart] = useState(1); // For IELTS Reading part selection
  const [writingPart, setWritingPart] = useState(1); // For IELTS Writing part selection
  const [speakingPart, setSpeakingPart] = useState(1); // For IELTS Speaking part selection
  const [viewingImage, setViewingImage] = useState<string | null>(null); // Image viewer
  const [viewingPassage, setViewingPassage] = useState(false); // Reading passage panel
  const [readingTimerState, setReadingTimerState] = useState<{
    timeRemaining: number;
    isExpired: boolean;
    formatTime: (s: number) => string;
    getTimeColor: () => string;
  } | null>(null); // IELTS Reading timer (shown in sidebar)
  const [splitPercent, setSplitPercent] = useState(55); // % width for questions side in split view
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef(false);
  
  // IELTS section navigation
  const [showIELTSSectionChangeModal, setShowIELTSSectionChangeModal] = useState(false);
  const [pendingSectionChange, setPendingSectionChange] = useState<{ fromId: string; toId: string } | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set()); // Track which sections user has left

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredFromPersistence = useRef(false);

  // Resizable split drag logic for IELTS Reading passage panel
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(75, Math.max(25, pct)));
    };
    const onMouseUp = () => { isDraggingSplit.current = false; };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Helper functions for localStorage (defined before hook so they can be used in onRestore)
  const saveCompletedSectionsToStorageHelper = (completed: Set<string>) => {
    if (typeof window !== "undefined") {
      const storageKey = `ielts_completed_sections_${attemptId}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(completed)));
    }
  };

  const loadCompletedSectionsFromStorageHelper = (): Set<string> => {
    if (typeof window !== "undefined") {
      const storageKey = `ielts_completed_sections_${attemptId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse completed sections from localStorage:", e);
        }
      }
    }
    return new Set<string>();
  };

  // Persistence hook - auto-saves state to localStorage
  const { clearStorage: clearPersistence } = useAttemptPersistence({
    attemptId,
    moduleType: data?.examCategory,
    answers,
    activeSection,
    sectionStartTimes,
    lockedSections,
    completedSections,
    isSubmitted: submitting || showSuccessModal,
    onRestore: (restored: PersistedAttemptState) => {
      // Only restore once
      if (hasRestoredFromPersistence.current) return;
      hasRestoredFromPersistence.current = true;

      // Restore answers
      if (restored.answers && Object.keys(restored.answers).length > 0) {
        setAnswers(restored.answers);
      }

      // Restore section start times
      if (restored.sectionStartTimes) {
        setSectionStartTimes(restored.sectionStartTimes);
      }

      // Restore locked sections
      if (restored.lockedSections) {
        setLockedSections(new Set(restored.lockedSections));
      }

      // Restore completed sections (IELTS) - check both persistence and localStorage
      const localStorageCompleted = loadCompletedSectionsFromStorageHelper();
      if (restored.completedSections) {
        const restoredSet = new Set(restored.completedSections);
        // Merge with localStorage (localStorage takes priority)
        const merged = new Set([...restoredSet, ...localStorageCompleted]);
        setCompletedSections(merged);
        // Save merged back to localStorage
        if (merged.size > 0) {
          saveCompletedSectionsToStorageHelper(merged);
        }
      } else if (localStorageCompleted.size > 0) {
        // Only localStorage has data
        setCompletedSections(localStorageCompleted);
      }

      // Restore active section (will be validated later when data is loaded)
      if (restored.activeSection) {
        setActiveSection(restored.activeSection);
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

  // Clear all localStorage data for this attempt
  const clearAllAttemptLocalStorage = useCallback(() => {
    if (typeof window === "undefined" || !data) return;
    
    // Clear answers
    const answersKey = getLocalStorageKey(attemptId);
    localStorage.removeItem(answersKey);
    
    // Clear completed sections (IELTS)
    const completedSectionsKey = `ielts_completed_sections_${attemptId}`;
    localStorage.removeItem(completedSectionsKey);
    
    // Clear all timers for this attempt (SAT and IELTS)
    if (data.sections) {
      data.sections.forEach((section) => {
        // Clear SAT timers
        const satTimerKey = `sat_timer_${attemptId}_${section.id}`;
        localStorage.removeItem(satTimerKey);
        
        // Clear IELTS Listening timers
        if (section.type === "LISTENING" && data.examCategory === "IELTS") {
          const ieltsTimerKey = `ielts_listening_timer_${attemptId}_${section.id}`;
          localStorage.removeItem(ieltsTimerKey);
        }
        // Clear IELTS Reading timers
        if (section.type === "READING" && data.examCategory === "IELTS") {
          const ieltsReadingTimerKey = `ielts_reading_timer_${attemptId}_${section.id}`;
          localStorage.removeItem(ieltsReadingTimerKey);
        }
        // Clear IELTS Writing timers
        if (section.type === "WRITING" && data.examCategory === "IELTS") {
          const ieltsWritingTimerKey = `ielts_writing_timer_${attemptId}_${section.id}`;
          localStorage.removeItem(ieltsWritingTimerKey);
        }
        // Clear IELTS Speaking timers
        if (section.type === "SPEAKING" && data.examCategory === "IELTS") {
          const ieltsSpeakingTimerKey = `ielts_speaking_timer_${attemptId}_${section.id}`;
          localStorage.removeItem(ieltsSpeakingTimerKey);
        }
      });
    }

    // Clear persistence data (from useAttemptPersistence hook)
    clearPersistence();
    
    // Clear any other attempt-related localStorage items
    const persistenceKey = `ielts_attempt:${attemptId}${data.examCategory ? `:${data.examCategory}` : ""}`;
    localStorage.removeItem(persistenceKey);
  }, [attemptId, data, clearPersistence]);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  // Handle Writing part changes - switch between Task 1 and Task 2 sections
  useEffect(() => {
    if (!data || data.examCategory !== "IELTS") return;
    
    const writingSections = data.sections.filter(s => s.type === "WRITING");
    if (writingSections.length < 2) return; // Only switch if there are separate Task 1 and Task 2 sections
    
    const task1Section = writingSections.find(s => s.title.includes("Task 1") || s.title.includes("task 1"));
    const task2Section = writingSections.find(s => s.title.includes("Task 2") || s.title.includes("task 2"));
    
    // Only switch if we're currently in a Writing section and need to switch to a different task
    const currentSection = data.sections.find(s => s.id === activeSection);
    if (currentSection?.type !== "WRITING") return;
    
    if (writingPart === 1 && task1Section && activeSection !== task1Section.id) {
      // Switch to Task 1 section
      handleSectionClick(task1Section.id);
    } else if (writingPart === 2 && task2Section && activeSection !== task2Section.id) {
      // Switch to Task 2 section
      handleSectionClick(task2Section.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writingPart]);

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
        // For IELTS: Load completed sections and find first non-completed section
        if (json.examCategory === "IELTS") {
          const loadedCompletedSections = loadCompletedSectionsFromStorageHelper();
          if (loadedCompletedSections.size > 0) {
            setCompletedSections(loadedCompletedSections);
          }
          const sectionOrder = ["LISTENING", "READING", "WRITING", "SPEAKING"];
          
          // Find first non-completed section
          let firstNonCompletedSection = null;
          for (const sectionType of sectionOrder) {
            const sectionOfType = json.sections.find(
              (s: Section) => s.type === sectionType && !loadedCompletedSections.has(s.id)
            );
            if (sectionOfType) {
              firstNonCompletedSection = sectionOfType;
              break;
            }
          }
          
          // If all sections completed, use last section
          const targetSection = firstNonCompletedSection || json.sections[json.sections.length - 1];
          
          // Only set if not already restored from persistence
          if (!hasRestoredFromPersistence.current || !activeSection) {
            setActiveSection(targetSection.id);
            setAccessedSections((prev) => new Set([...prev, targetSection.id]));
          }
        } else {
          // Non-IELTS: Don't override activeSection if it was already restored from persistence
          const shouldSetDefaultSection = !hasRestoredFromPersistence.current || !activeSection;
          
          if (shouldSetDefaultSection) {
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
    // Locked və ya completed section-larda dəyişiklik etmək olmaz
    if (lockedSections.has(sectionId) || completedSections.has(sectionId)) return;

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
      clearAllAttemptLocalStorage();

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
      onDropComplete?: () => void,
      sectionType?: string
    ) => {
      const props = {
        question: q,
        value,
        onChange,
        readOnly,
        showWordBank,
        externalDraggedOption,
        onDropComplete,
        onImageClick: (imageUrl: string) => setViewingImage(imageUrl),
      };

    switch (q.qtype) {
      case "MCQ_SINGLE":
        return <QMcqSingle {...props} />;
      case "MCQ_MULTI":
        return <QMcqMulti {...props} />;
      case "TF":
        return <QTF {...props} />;
        case "TF_NG":
          return <QTFNG {...props} />;
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
           <div className="space-y-3">
             {/* Question Image */}
             {q.prompt?.imageUrl && (
               <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                 <img
                   src={q.prompt.imageUrl}
                   alt="Question diagram"
                   onClick={() => onImageClick(q.prompt.imageUrl)}
                   className="h-auto max-h-96 mx-auto rounded border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                   style={{ width: "90%", minWidth: "90%" }}
                 />
               </div>
             )}
             <textarea
               value={value || ""}
               onChange={(e) => onChange(e.target.value)}
               disabled={readOnly}
               className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 min-h-[200px] disabled:bg-gray-50 resize-y"
               placeholder="Write your essay here..."
             />
           </div>
         );
       case "FILL_IN_BLANK":
         return <QFillInBlank {...props} />;
       case "SPEAKING_RECORDING":
         return <QSpeakingRecording {...props} attemptId={attemptId} speakingPart={sectionType === "SPEAKING" ? speakingPart : undefined} />;
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
    [attemptId, speakingPart]
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

    // For IELTS: Merge Listening subsections stats into first Listening section
    if (data.examCategory === "IELTS") {
      const listeningSections = data.sections.filter(s => s.type === "LISTENING");
      if (listeningSections.length > 1) {
        const firstListeningId = listeningSections[0].id;
        let totalAnswered = 0;
        let totalQuestions = 0;
        
        listeningSections.forEach(section => {
          const sectionStat = stats[section.id] || { answered: 0, total: 0 };
          totalAnswered += sectionStat.answered;
          totalQuestions += sectionStat.total;
        });
        
        // Update first Listening section stats with merged data
        stats[firstListeningId] = { answered: totalAnswered, total: totalQuestions };
      }

      // Same for Reading
      const readingSections = data.sections.filter(s => s.type === "READING");
      if (readingSections.length > 1) {
        const firstReadingId = readingSections[0].id;
        let totalAnswered = 0;
        let totalQuestions = 0;
        
        readingSections.forEach(section => {
          const sectionStat = stats[section.id] || { answered: 0, total: 0 };
          totalAnswered += sectionStat.answered;
          totalQuestions += sectionStat.total;
        });
        
        stats[firstReadingId] = { answered: totalAnswered, total: totalQuestions };
      }
    }

    return stats;
  }, [
    data?.sections,
    data?.examCategory,
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

      // IELTS üçün: Strict section order və geriyə qayıtma qadağası (yalnız növbəti section-a keçid)
      if (data.examCategory === "IELTS") {
        const currentSection = data.sections.find(s => s.id === activeSection);
        const targetSection = data.sections.find(s => s.id === sectionId);
        
        if (!currentSection || !targetSection) return;
        
        // IELTS section order: LISTENING -> READING -> WRITING -> SPEAKING
        const sectionOrder = ["LISTENING", "READING", "WRITING", "SPEAKING"];
        const currentOrder = sectionOrder.indexOf(currentSection.type);
        const targetOrder = sectionOrder.indexOf(targetSection.type);

        const isSameSection = sectionId === activeSection;
        const isNextSectionType =
          currentOrder !== -1 &&
          targetOrder === currentOrder + 1 &&
          currentSection.type !== targetSection.type;

        // Yalnız cari section və onun ardınca gələn növbəti section type kliklənə bilər.
        // Digər hallarda heç nə etmədən çıxırıq (alert yoxdur).
        if (!isSameSection && !isNextSectionType) {
          return;
        }

        // Növbəti əsas section-a keçid zamanı modal açılır
        if (isNextSectionType) {
          setPendingSectionChange({ fromId: activeSection, toId: sectionId });
          setShowIELTSSectionChangeModal(true);
          return; // Wait for modal confirmation
        }
      }

      // Save current section before switching
      if (activeSection && answers[activeSection]) {
        const currentSection = data.sections.find(s => s.id === activeSection);
        const targetSection = data.sections.find(s => s.id === sectionId);
        
        // IELTS Writing: Submit writing when leaving Writing section
        if (data.examCategory === "IELTS" && currentSection?.type === "WRITING" && targetSection?.type !== "WRITING") {
          try {
            // Get all writing section answers
            const writingSections = data.sections.filter(s => s.type === "WRITING");
            const task1Section = writingSections.find(s => s.title.includes("Task 1"));
            const task2Section = writingSections.find(s => s.title.includes("Task 2"));
            
            const task1Response = task1Section ? answers[task1Section.id]?.["writing_text"] || "" : "";
            const task2Response = task2Section ? answers[task2Section.id]?.["writing_text"] || "" : "";
            
            // Only submit if we have responses
            if (task1Response || task2Response) {
              const writingStartTime = sectionStartTimes[writingSections[0]?.id];
              const timeSpent = writingStartTime ? Math.floor((Date.now() - writingStartTime) / 1000) : 0;
              
              await fetch(`/api/attempts/${attemptId}/writing/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  task1Response,
                  task2Response,
                  startedAt: writingStartTime ? new Date(writingStartTime).toISOString() : new Date().toISOString(),
                  timeSpentSeconds: timeSpent,
                }),
              });
            }
          } catch (error) {
            console.error("Failed to submit writing:", error);
            // Don't block navigation if submission fails
          }
        }
        
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
    [activeSection, answers, saveSection, data, accessedSections, sectionStartTimes, lockedSections, attemptId, completedSections]
  );

  // IELTS: Handle confirmed section change
  const handleIELTSSectionChangeConfirm = useCallback(async () => {
    if (!pendingSectionChange || !data) return;

    const { fromId, toId } = pendingSectionChange;
    
    // Mark current section as completed
    const newCompletedSections = new Set([...completedSections, fromId]);
    setCompletedSections(newCompletedSections);
    
    // Save to localStorage immediately
    saveCompletedSectionsToStorageHelper(newCompletedSections);
    
    // Save current section answers
    if (answers[fromId]) {
      await saveSection(fromId, answers[fromId]);
    }
    
    // Switch to target section
    setActiveSection(toId);
    setPendingSectionChange(null);
  }, [pendingSectionChange, data, answers, saveSection, completedSections]);

  const handleAnswerChange = useCallback(
    (questionId: string, value: any) => {
      if (!data?.sections) return;
      
      // Find which section this question belongs to
      const questionSection = data.sections.find(s => 
        s.questions.some(q => q.id === questionId)
      );
      
      if (questionSection) {
        setAnswer(questionSection.id, questionId, value);
      }
    },
    [data?.sections]
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

  // Hooks must run before any conditional return (same count every render — React #310)
  const currentSection = data?.sections?.find((s: { id: string }) => s.id === activeSection) ?? null;
  const isSAT = data?.examCategory === "SAT";

  const readingPartProgress = useMemo(() => {
    if (!currentSection || currentSection.type !== "READING" || data?.examCategory !== "IELTS") return [];
    const questions = currentSection.questions || [];
    const parts = [
      questions.filter((q: { order: number }) => q.order >= 0 && q.order < 14),
      questions.filter((q: { order: number }) => q.order >= 14 && q.order < 27),
      questions.filter((q: { order: number }) => q.order >= 27),
    ];
    return parts.map((partQuestions: { id: string; order: number }[]) => {
      const sectionAnswers = answers[currentSection.id] || {};
      const answered = partQuestions.filter((q) => {
        const v = sectionAnswers[q.id];
        return v !== undefined && v !== null && v !== "";
      }).length;
      return {
        answered,
        total: partQuestions.length,
        percentage: partQuestions.length > 0 ? (answered / partQuestions.length) * 100 : 0,
      };
    });
  }, [currentSection, activeSection, answers, data?.examCategory]);

  useEffect(() => {
    if (!currentSection || currentSection.type !== "READING" || data?.examCategory !== "IELTS") {
      setReadingTimerState(null);
    }
  }, [activeSection, currentSection?.type, data?.examCategory]);

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

  return (
    <>
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
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

        <div className="w-full flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-12 xl:px-16 pt-3 pb-3">
        <div className="flex flex-1 flex-col lg:flex-row gap-6 min-h-0">
            <ExamSidebar
              examTitle={data.examTitle}
              sections={data.sections}
              activeSection={activeSection}
              lockedSections={lockedSections}
              completedSections={completedSections}
              progressStats={progressStats}
              sectionStats={sectionStats}
              submitting={submitting}
              isSAT={isSAT}
              currentSectionIndex={data.sections.findIndex((s) => s.id === activeSection)}
              onSectionClick={handleSectionClick}
              onSubmit={handleSubmitClick}
              onSubmitModule={isSAT ? handleSubmitModuleClick : undefined}
              getShortSectionTitle={getShortSectionTitle}
              examCategory={data.examCategory}
              readingPart={readingPart}
              onReadingPartChange={setReadingPart}
              readingTimerState={readingTimerState}
              readingPartProgress={readingPartProgress}
              isIELTSReading={currentSection?.type === "READING" && data.examCategory === "IELTS"}
            />

            {currentSection && (() => {
              const isReadingSplit = currentSection.type === "READING" && data.examCategory === "IELTS";
              const rawPassage = (currentSection as any).passage || currentSection.questions?.[0]?.prompt?.passage;
              const passageText = typeof rawPassage === "object" && rawPassage !== null
                ? (rawPassage as any)[`part${readingPart}`] || Object.values(rawPassage as any).join("\n\n")
                : rawPassage;

              const questionsAreaEl = (
                <QuestionsArea
                  section={currentSection}
                  answers={answers}
                  isLocked={lockedSections.has(currentSection.id) || completedSections.has(currentSection.id)}
                  wordBankPositions={wordBankPositions}
                  draggedOptions={draggedOptions}
                  onAnswerChange={handleAnswerChange}
                  onWordBankPositionChange={handleWordBankPositionChange}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  renderQuestionComponent={renderQuestionComponent}
                  examCategory={data.examCategory}
                  userRole="STUDENT"
                  allSections={data.sections}
                  currentSectionIndex={data.sections.findIndex((s) => s.id === activeSection)}
                  listeningPart={listeningPart}
                  onListeningPartChange={setListeningPart}
                  onTimeExpired={() => handleTimeExpired(currentSection.id)}
                  attemptId={attemptId}
                  readingPart={readingPart}
                  onReadingPartChange={setReadingPart}
                  isPassageOpen={viewingPassage}
                  onPassageToggle={() => setViewingPassage((v) => !v)}
                  onReadingTimerStateChange={setReadingTimerState}
                  writingPart={writingPart}
                  onWritingPartChange={setWritingPart}
                  speakingPart={speakingPart}
                  onSpeakingPartChange={setSpeakingPart}
                />
              );

              if (!isReadingSplit) {
                return (
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {questionsAreaEl}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  ref={splitContainerRef}
                  className="flex flex-1 min-w-0 min-h-0 gap-0"
                  style={{ userSelect: isDraggingSplit.current ? "none" : "auto" }}
                >
                  {/* Questions side */}
                  <div style={{ width: `${splitPercent}%`, minWidth: "25%" }} className="min-w-0 flex flex-col h-full overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {questionsAreaEl}
                    </div>
                  </div>

                  {/* Drag handle */}
                  <div
                    onMouseDown={() => { isDraggingSplit.current = true; }}
                    className="flex-shrink-0 w-3 flex items-center justify-center cursor-col-resize group mx-1"
                  >
                    <div className="w-1 h-16 rounded-full bg-slate-300 group-hover:bg-[#303380] transition-colors duration-150" />
                  </div>

                  {/* Passage side - no close button, passage always visible; part choosers moved to sidebar */}
                  <div style={{ flex: 1, minWidth: "25%" }} className="min-w-0 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-5 py-4 flex-shrink-0" style={{ backgroundColor: "#303380" }}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-semibold text-white text-sm">Reading Passage</span>
                    </div>

                    {/* Passage text - part selected via sidebar */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">{passageText}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
                   </div>
                </div>
              </div>


      {/* Image Viewer - fixed on the RIGHT; backdrop does not block scroll */}
      {viewingImage && (
        <>
          {/* Backdrop - visual only; pointer-events: none so main content stays scrollable */}
          <div
            className="fixed inset-0 bg-black/30 z-[100] pointer-events-none"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
            aria-hidden
          />
          {/* Panel on the right - has pointer-events so you can scroll the image and use close */}
          <div
            className="fixed top-0 h-full bg-white shadow-2xl z-[101] flex flex-col pointer-events-auto"
            style={{ right: 0, width: "500px", maxWidth: "100vw" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Image Viewer</h3>
              <button
                onClick={() => setViewingImage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 min-h-0">
              <img
                src={viewingImage}
                alt="Viewing"
                className="max-w-full h-auto object-contain"
              />
            </div>
          </div>
        </>
      )}

      {/* Modals and Notifications */}
      <ResumeNotification
        isOpen={showResumeNotification}
        onClose={() => setShowResumeNotification(false)}
      />

      <SubmitModuleModal
        isOpen={showSubmitModuleModal && isSAT && !!currentSection}
        onClose={() => setShowSubmitModuleModal(false)}
        onConfirm={handleSubmitModuleConfirm}
        sectionTitle={currentSection?.title || ""}
      />

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitConfirm}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
      />

      {/* IELTS Section Change Modal */}
      {data?.examCategory === "IELTS" && pendingSectionChange && (
        <IELTSSectionChangeModal
          isOpen={showIELTSSectionChangeModal}
          onClose={() => {
            setShowIELTSSectionChangeModal(false);
            setPendingSectionChange(null);
          }}
          onConfirm={handleIELTSSectionChangeConfirm}
          fromSection={data.sections.find(s => s.id === pendingSectionChange.fromId)?.title || ""}
          toSection={data.sections.find(s => s.id === pendingSectionChange.toId)?.title || ""}
          currentSectionAnswers={answers[pendingSectionChange.fromId] || {}}
          currentSectionQuestions={
            data.sections.find(s => s.id === pendingSectionChange.fromId)?.questions || []
          }
        />
      )}
                             </>
    );
}
