"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  Headphones,
  Loader2,
  Mic,
  Pause,
  PenLine,
  Play,
  Save,
  Volume2,
} from "lucide-react";
import FormattedText from "@/components/FormattedText";
import QHtmlCss from "@/components/questions/QHtmlCss";
import { QSpeakingRecording } from "@/components/questions/QSpeakingRecording";

type Question = {
  id: string;
  qtype: string;
  prompt: any;
  options?: any;
  answerKey?: any;
  order: number;
  maxScore?: number;
  image?: string | null;
};

type Section = {
  id: string;
  type: "LISTENING" | "READING" | "WRITING" | "SPEAKING" | string;
  title: string;
  durationMin: number;
  order: number;
  instruction?: string;
  passage?: any;
  audio?: string | null;
  introduction?: string | null;
  questions: Question[];
};

type AttemptPayload = {
  id: string;
  examTitle: string;
  examCategory?: string;
  status: string;
  sections: Section[];
  savedAnswers: Record<string, Record<string, any>>;
};

type Props = {
  attemptId: string;
  onUnauthorized?: () => void;
  onLoadError?: () => void;
};

function answersStorageKey(attemptId: string) {
  return `exam_answers_${attemptId}`;
}

function ieltsTimerKey(attemptId: string, sectionId: string) {
  return `ielts_digital_timer_${attemptId}_${sectionId}`;
}

function ieltsAudioCheckpointKey(attemptId: string, sectionId: string) {
  return `ielts_audio_checkpoint_${attemptId}_${sectionId}`;
}

function ieltsLockedSectionsKey(attemptId: string) {
  return `ielts_digital_locked_sections_${attemptId}`;
}

function loadLockedSections(attemptId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ieltsLockedSectionsKey(attemptId));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function persistLockedSections(attemptId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ieltsLockedSectionsKey(attemptId), JSON.stringify([...ids]));
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function sectionPartCount(section: Section) {
  if (section.type === "LISTENING") return 4;
  if (section.type === "READING") return 3;
  if (section.type === "WRITING") return 2;
  if (section.type === "SPEAKING") return 3;
  return 1;
}

function partLabel(section: Section, part: number) {
  if (section.type === "READING") return `Passage ${part}`;
  if (section.type === "WRITING") return `Task ${part}`;
  return `Part ${part}`;
}

function filterQuestionsByPart(section: Section, part: number) {
  const prefix = section.type === "WRITING" ? `task${part}` : `part${part}`;
  const questions = section.questions || [];
  
  console.log("=== FILTER QUESTIONS DEBUG ===");
  console.log("Section type:", section.type);
  console.log("Looking for part:", part);
  console.log("Prefix:", prefix);
  console.log("All question IDs:", questions.map(q => q.id));
  
  const tagged = questions.filter((q) => q.id.includes(prefix));
  console.log("Filtered questions:", tagged.map(q => q.id));

  // If we found questions with this part tag, return them
  if (tagged.length > 0) {
    console.log("Found", tagged.length, "questions for", prefix);
    return tagged;
  }

  // If no questions found for this part, check if ANY questions have part tags
  // If no part tags exist at all (old exams), show all questions in part 1
  const hasAnyPartTags = questions.some((q) => /q-(part|task)\d+/.test(q.id));
  console.log("Has any part tags:", hasAnyPartTags);
  
  if (!hasAnyPartTags && part === 1) {
    // Legacy exam with no part tags - show all questions in part 1
    console.log("Legacy mode: showing all questions in part 1");
    return questions;
  }
  
  // No questions for this part
  console.log("No questions found for", prefix);
  return [];
}

function getReadingPassage(section: Section, part: number) {
  const passage = section.passage;
  if (passage && typeof passage === "object") {
    return String(passage[`part${part}`] || "");
  }
  return typeof passage === "string" ? passage : "";
}

function sectionIcon(type: string) {
  if (type === "LISTENING") return Headphones;
  if (type === "READING") return BookOpen;
  if (type === "WRITING") return PenLine;
  if (type === "SPEAKING") return Mic;
  return BookOpen;
}

function isQuestionAnswered(question: Question, value: any) {
  if (value == null) return false;
  if (question.qtype === "HTML_CSS") {
    if (typeof value !== "object") return false;
    return Object.values(value).some((v) => {
      if (typeof v === "boolean") return v;
      if (v == null) return false;
      return String(v).trim().length > 0;
    });
  }
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function IeltsAudioPlayer({
  src,
  checkpointKey,
}: {
  src: string;
  checkpointKey: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const lastSavedSecondRef = useRef<number | null>(null);
  const savedAtRef = useRef<number | null>(null);
  const bufferCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateSavedAt = (time: number | null) => {
    savedAtRef.current = time;
    setSavedAt(time);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(checkpointKey);
    const n = raw ? Number(raw) : NaN;
    const saved = Number.isFinite(n) && n > 0 ? n : null;
    updateSavedAt(saved);
    lastSavedSecondRef.current = saved == null ? null : Math.floor(saved);
  }, [checkpointKey]);

  // Cleanup buffer check interval on unmount
  useEffect(() => {
    return () => {
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current);
      }
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const autoSaveCheckpoint = (time: number) => {
    if (typeof window === "undefined") return;
    const sec = Math.floor(Math.max(0, time));
    const existing = savedAtRef.current;
    if (existing != null && sec < Math.floor(existing)) return;
    if (lastSavedSecondRef.current === sec) return;
    lastSavedSecondRef.current = sec;
    localStorage.setItem(checkpointKey, String(time));
    updateSavedAt(time);
  };

  const resumeCheckpoint = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Read the saved time from localStorage
    const raw = typeof window !== "undefined" ? localStorage.getItem(checkpointKey) : null;
    const storedTime = raw ? Number(raw) : NaN;
    const target =
      Number.isFinite(storedTime) && storedTime > 0
        ? storedTime
        : savedAtRef.current;
    
    if (target == null || target <= 0) return;
    
    // Check if audio duration is loaded and target is valid
    if (!audio.duration || audio.duration <= 0) {
      alert("Audio is still loading. Please wait a moment and try again.");
      return;
    }
    
    if (target > audio.duration) {
      alert(`Saved time ${formatTime(Math.floor(target))} is beyond audio duration.`);
      return;
    }
    
    // Check if already buffered
    let isBuffered = false;
    if (audio.seekable.length > 0) {
      const seekEnd = audio.seekable.end(audio.seekable.length - 1);
      isBuffered = seekEnd >= target;
    }
    
    if (isBuffered) {
      // Already buffered, seek immediately
      performSeek(target);
    } else {
      // Need to buffer first
      startBufferingForSeek(target);
    }
  };
  
  const startBufferingForSeek = (target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setBuffering(true);
    setBufferProgress(0);
    
    // Pause current playback
    if (!audio.paused) {
      audio.pause();
    }
    
    // Force load the audio
    audio.load();
    
    // Monitor buffer progress
    let attempts = 0;
    const maxAttempts = 50; // 10 seconds max wait (50 * 200ms)
    
    if (bufferCheckInterval.current) {
      clearInterval(bufferCheckInterval.current);
    }
    
    bufferCheckInterval.current = setInterval(() => {
      attempts++;
      
      if (!audio) {
        clearInterval(bufferCheckInterval.current!);
        setBuffering(false);
        return;
      }
      
      // Check seekable range
      let seekEnd = 0;
      if (audio.seekable.length > 0) {
        seekEnd = audio.seekable.end(audio.seekable.length - 1);
      }
      
      const progress = audio.duration > 0 ? (seekEnd / audio.duration) * 100 : 0;
      setBufferProgress(Math.min(progress, 99));
      
      // Check if buffered enough
      if (seekEnd >= target) {
        // Success! Buffered enough
        clearInterval(bufferCheckInterval.current!);
        setBuffering(false);
        setBufferProgress(0);
        performSeek(target);
      } else if (attempts >= maxAttempts) {
        // Timeout - try anyway
        clearInterval(bufferCheckInterval.current!);
        setBuffering(false);
        setBufferProgress(0);
        alert(
          `Buffering timeout. The audio will start from the beginning.\n\n` +
          `Tip: Let the audio play for a few minutes to buffer, then try resuming.`
        );
        audio.currentTime = 0;
        setCurrent(0);
        void audio.play();
      }
    }, 200);
  };
  
  const performSeek = (target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const originalBlock = lastSavedSecondRef.current;
    lastSavedSecondRef.current = Math.floor(target);
    
    // Pause if playing
    if (!audio.paused) {
      audio.pause();
    }
    
    let seeked = false;
    const onSeeked = () => {
      if (seeked) return;
      seeked = true;
      audio.removeEventListener("seeked", onSeeked);
      const actualTime = audio.currentTime;
      
      // Check if seek actually worked
      if (Math.abs(actualTime - target) > 2) {
        alert(
          `Unable to jump to ${formatTime(Math.floor(target))}. ` +
          `The audio server doesn't support seeking. Playing from ${formatTime(Math.floor(actualTime))}.`
        );
      }
      
      setCurrent(actualTime);
      if (actualTime > 1) {
        updateSavedAt(actualTime);
      }
      void audio.play();
      
      setTimeout(() => {
        if (lastSavedSecondRef.current === Math.floor(target)) {
          lastSavedSecondRef.current = originalBlock;
        }
      }, 200);
    };
    
    const timeout = setTimeout(() => {
      if (!seeked) {
        onSeeked();
      }
    }, 1000);
    
    audio.addEventListener("seeked", onSeeked);
    
    try {
      audio.currentTime = target;
      setCurrent(target);
    } catch (e) {
      clearTimeout(timeout);
      audio.removeEventListener("seeked", onSeeked);
      alert("Failed to seek. Please try again.");
      lastSavedSecondRef.current = originalBlock;
    }
  };

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm px-4 py-3">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const time = e.currentTarget.currentTime || 0;
          setCurrent(time);
          if (!e.currentTarget.paused) autoSaveCheckpoint(time);
        }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 shadow-sm shrink-0"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = next;
              setCurrent(next);
              if (playing) autoSaveCheckpoint(next);
            }}
            className="w-full accent-slate-900"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500 tabular-nums">
            <span>{formatTime(Math.floor(current))}</span>
            <span>{duration ? formatTime(Math.floor(duration)) : "--:--"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:pl-2 sm:border-l border-slate-200">
          <Volume2 className="w-4 h-4 text-slate-500 hidden sm:block" />
          <button
            type="button"
            disabled={savedAt == null || buffering}
            onClick={resumeCheckpoint}
            className="w-32 sm:w-36 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap text-center flex items-center justify-center gap-2"
            title={
              buffering
                ? `Buffering audio... ${Math.floor(bufferProgress)}%`
                : savedAt == null
                  ? "Playback time will be saved automatically after pressing play."
                  : `Resume from ${formatTime(Math.floor(savedAt))}`
            }
          >
            {buffering ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {Math.floor(bufferProgress)}%
              </>
            ) : savedAt == null ? (
              "Auto-save ready"
            ) : (
              `Saved ${formatTime(Math.floor(savedAt))}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IeltsDigitalRunner({ attemptId, onUnauthorized, onLoadError }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttemptPayload | null>(null);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [parts, setParts] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedSections, setLockedSections] = useState<Set<string>>(() => new Set());
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const sections = useMemo(() => {
    if (!data?.sections) return [];
    const order = ["LISTENING", "READING", "WRITING", "SPEAKING"];
    return [...data.sections].sort((a, b) => {
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.order - b.order;
    });
  }, [data?.sections]);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0] || null;
  const activePart = activeSection ? parts[activeSection.id] || 1 : 1;
  const questions = activeSection ? filterQuestionsByPart(activeSection, activePart) : [];

  const currentSectionStats = useMemo(() => {
    if (!activeSection) return { answered: 0, unanswered: 0, total: 0 };
    const sectionAnswers = answers[activeSection.id] || {};
    const total = activeSection.questions.length;
    const answered = activeSection.questions.filter((q) =>
      isQuestionAnswered(q, sectionAnswers[q.id])
    ).length;
    return { answered, unanswered: Math.max(0, total - answered), total };
  }, [activeSection, answers]);

  const saveSection = useCallback(
    async (section: Section, sectionAnswers: Record<string, any>) => {
      await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.type,
          answers: sectionAnswers,
        }),
      });
    },
    [attemptId]
  );

  const loadAttempt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = (await res.json()) as AttemptPayload & { error?: string };
      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed to load IELTS attempt");

      if (json.status === "SUBMITTED" || json.status === "COMPLETED") {
        router.replace(`/attempts/${attemptId}/results`);
        return;
      }
      if (json.examCategory && json.examCategory !== "IELTS") {
        router.replace(`/attempts/${attemptId}/run`);
        return;
      }

      let loaded: Record<string, Record<string, any>> = {};
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(answersStorageKey(attemptId));
        if (raw) {
          try {
            loaded = JSON.parse(raw);
          } catch {
            localStorage.removeItem(answersStorageKey(attemptId));
          }
        }
      }

      for (const section of json.sections || []) {
        if (json.savedAnswers?.[section.type]) {
          loaded[section.id] = {
            ...(loaded[section.id] || {}),
            ...json.savedAnswers[section.type],
          };
        }
      }

      setData(json);
      setAnswers(loaded);
      const locked = loadLockedSections(attemptId);
      setLockedSections(locked);
      if (Object.keys(loaded).length > 0 && typeof window !== "undefined") {
        localStorage.setItem(answersStorageKey(attemptId), JSON.stringify(loaded));
      }

      const first = (json.sections || [])
        .sort((a, b) => a.order - b.order)
        .find((section) => !locked.has(section.id)) || (json.sections || []).sort((a, b) => a.order - b.order)[0];
      setActiveSectionId(first?.id || "");
      const initialParts: Record<string, number> = {};
      for (const section of json.sections || []) initialParts[section.id] = 1;
      setParts(initialParts);
    } catch (e) {
      console.error(e);
      onLoadError?.();
    } finally {
      setLoading(false);
    }
  }, [attemptId, onLoadError, onUnauthorized, router]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  useEffect(() => {
    if (!activeSection) return;
    const durationSeconds = Math.max(1, activeSection.durationMin) * 60;
    const key = ieltsTimerKey(attemptId, activeSection.id);
    let endTime = 0;

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { endTime?: number };
          if (parsed.endTime && parsed.endTime > Date.now()) {
            endTime = parsed.endTime;
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
      if (!endTime) {
        endTime = Date.now() + durationSeconds * 1000;
        localStorage.setItem(key, JSON.stringify({ startTime: Date.now(), endTime }));
      }
    } else {
      endTime = Date.now() + durationSeconds * 1000;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [activeSection, attemptId]);

  const setAnswer = (questionId: string, value: any) => {
    if (!activeSection) return;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [activeSection.id]: {
          ...(prev[activeSection.id] || {}),
          [questionId]: value,
        },
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(answersStorageKey(attemptId), JSON.stringify(next));
      }
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => {
        saveSection(activeSection, answersRef.current[activeSection.id] || {});
      }, 1500);
      return next;
    });
  };

  const submitExam = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      for (const section of sections) {
        await saveSection(section, answersRef.current[section.id] || {});
      }
      const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to submit");
      if (typeof window !== "undefined") {
        localStorage.removeItem(answersStorageKey(attemptId));
        localStorage.removeItem(ieltsLockedSectionsKey(attemptId));
        for (const section of sections) {
          localStorage.removeItem(ieltsTimerKey(attemptId, section.id));
          localStorage.removeItem(ieltsAudioCheckpointKey(attemptId, section.id));
        }
      }
      router.replace(`/attempts/${attemptId}/results`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const requestSectionChange = (sectionId: string) => {
    if (!activeSection || sectionId === activeSection.id) return;
    if (lockedSections.has(sectionId)) {
      alert("This section has already been submitted and cannot be reopened.");
      return;
    }
    setPendingSectionId(sectionId);
  };

  const confirmSectionChange = async () => {
    if (!activeSection || !pendingSectionId) return;
    await saveSection(activeSection, answersRef.current[activeSection.id] || {});
    setLockedSections((prev) => {
      const next = new Set([...prev, activeSection.id]);
      persistLockedSections(attemptId, next);
      return next;
    });
    setActiveSectionId(pendingSectionId);
    setPendingSectionId(null);
  };

  if (loading || !data || !activeSection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-600">
        Loading IELTS exam...
      </div>
    );
  }

  const pendingSection = pendingSectionId
    ? sections.find((section) => section.id === pendingSectionId)
    : null;

  const renderLeftPanel = () => {
    if (activeSection.type === "LISTENING") {
      return (
        <div className="h-full overflow-y-auto p-4">
          <h2 className="text-lg font-semibold text-slate-900 uppercase mb-4">
            Part {activePart}
          </h2>
          {activeSection.audio ? (
            <IeltsAudioPlayer
              src={activeSection.audio}
              checkpointKey={ieltsAudioCheckpointKey(attemptId, activeSection.id)}
            />
          ) : (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              No audio uploaded for this listening section.
            </div>
          )}
        </div>
      );
    }

    if (activeSection.type === "READING") {
      return (
        <div className="p-4 overflow-y-auto h-full">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Passage {activePart}
          </h2>
          <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            <FormattedText text={getReadingPassage(activeSection, activePart) || "No passage added."} />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          {activeSection.title}
        </h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap">
          {activeSection.instruction || "Complete this section."}
        </p>
      </div>
    );
  };

  const renderQuestion = (question: Question) => {
    const value = answers[activeSection.id]?.[question.id];
    if (question.qtype === "HTML_CSS") {
      return (
        <QHtmlCss
          key={question.id}
          question={question}
          value={value || {}}
          onChange={(v) => setAnswer(question.id, v)}
          readOnly={false}
          bare={activeSection.type === "LISTENING" || activeSection.type === "READING"}
        />
      );
    }

    if (question.qtype === "ESSAY") {
      return (
        <div key={question.id} className="space-y-3">
          {question.prompt?.text && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              <FormattedText text={question.prompt.text} />
            </p>
          )}
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            rows={14}
            className="w-full border border-slate-300 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-slate-500"
            placeholder="Write your answer here..."
          />
        </div>
      );
    }

    if (question.qtype === "SPEAKING_RECORDING") {
      return (
        <QSpeakingRecording
          key={question.id}
          question={question as any}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => setAnswer(question.id, v)}
          readOnly={false}
          attemptId={attemptId}
          speakingPart={activePart}
        />
      );
    }

    return (
      <div key={question.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Unsupported IELTS Digital question type: {question.qtype}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col text-slate-900">
      <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">{data.examTitle}</h1>
          <p className="text-xs text-slate-500">
            {activeSection.title} - {partLabel(activeSection, activePart)}
          </p>
        </div>
        <div className="text-xs text-emerald-700 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Answers save automatically
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-hidden grid grid-rows-[minmax(150px,34%)_1fr] md:grid-rows-none md:grid-cols-[minmax(280px,38%)_1fr]">
        <aside className="border-b md:border-b-0 md:border-r border-slate-200 bg-white min-h-0 overflow-hidden">
          {renderLeftPanel()}
        </aside>

        <section className="min-h-0 overflow-hidden p-0">
          {questions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              No question in this part yet.
            </div>
          ) : activeSection.type === "LISTENING" || activeSection.type === "READING" ? (
            <div className="h-full min-h-0">
              {renderQuestion(questions.find((q) => q.qtype === "HTML_CSS") || questions[0])}
            </div>
          ) : (
            <div className="h-full overflow-y-auto max-w-[980px] mx-auto p-6 space-y-6">
              {questions.map((q) => renderQuestion(q))}
            </div>
          )}
        </section>
      </main>

      <footer className="px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-4 bg-white overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white">
            Scores
          </button>
          {Array.from({ length: sectionPartCount(activeSection) }).map((_, idx) => {
            const part = idx + 1;
            const active = activePart === part;
            return (
              <button
                key={part}
                onClick={() => setParts((prev) => ({ ...prev, [activeSection.id]: part }))}
                className={`px-4 py-2 text-sm border rounded-md ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {part}
              </button>
            );
          })}
          <div className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700">
            {activeSection.title}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">
            <Clock className="w-4 h-4" />
            {secondsLeft == null ? "--:--" : formatTime(secondsLeft)}
          </div>
          {sections.map((section) => {
            const Icon = sectionIcon(section.type);
            const isActive = activeSection.id === section.id;
            const isLocked = lockedSections.has(section.id);
            return (
              <button
                key={section.id}
                onClick={() => requestSectionChange(section.id)}
                title={section.title}
                aria-label={section.title}
                disabled={isLocked && !isActive}
                className={`w-10 h-10 rounded-md border flex items-center justify-center transition ${
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isLocked
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
          <button
            onClick={() => {
              if (confirm("Submit the IELTS exam?")) void submitExam();
            }}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </footer>

      {pendingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Move to {pendingSection.title}?
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Before leaving <span className="font-medium">{activeSection.title}</span>, please review your work carefully.
              Once you continue, this section will be submitted and locked, and you will not be able to return to it.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                  Answered
                </div>
                <div className="mt-1 text-2xl font-semibold text-emerald-900 tabular-nums">
                  {currentSectionStats.answered}
                </div>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                <div className="text-xs font-medium text-rose-700 uppercase tracking-wide">
                  Unanswered
                </div>
                <div className="mt-1 text-2xl font-semibold text-rose-900 tabular-nums">
                  {currentSectionStats.unanswered}
                </div>
              </div>
            </div>

            {currentSectionStats.unanswered > 0 && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                You still have unanswered questions in this section. We recommend double-checking them before continuing.
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingSectionId(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
              >
                Review this section
              </button>
              <button
                type="button"
                onClick={() => void confirmSectionChange()}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Continue and lock section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

