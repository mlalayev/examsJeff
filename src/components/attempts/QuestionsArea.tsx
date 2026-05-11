"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QuestionCard } from "./QuestionCard";
import { DndGapQuestion } from "./DndGapQuestion";
import { IELTSListeningView } from "./IELTSListeningView";
import { IELTSReadingView } from "./IELTSReadingView";
import FormattedText from "@/components/FormattedText";
import { IELTSWritingView } from "./IELTSWritingView";
import { IELTSSpeakingView } from "./IELTSSpeakingView";
import {
  totalSecondsForSpeakingPart,
  prepSecondsForSpeakingPart,
  recordingMarkerPercent,
  isSpeakingPrepPhase,
} from "@/lib/ielts-speaking-timers";

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
  questions: Question[];
  order: number;
  audio?: string | null;
  instruction?: string;
  passage?: string | null;
  image?: string | null; // Section image (for IELTS Listening parts)
  introduction?: string | null; // Section introduction (for IELTS Listening parts)
}

interface QuestionsAreaProps {
  section: Section;
  answers: Record<string, any>; // Key is section.id now
  isLocked: boolean;
  wordBankPositions: Record<string, number>;
  draggedOptions: Record<string, string | null>;
  onAnswerChange: (questionId: string, value: any) => void;
  onWordBankPositionChange: (questionId: string, position: number) => void;
  onDragStart: (questionId: string, label: string, e: React.DragEvent) => void;
  onDragEnd: (questionId: string) => void;
  renderQuestionComponent: (
    q: Question,
    value: any,
    onChange: (v: any) => void,
    readOnly: boolean,
    showWordBank?: boolean,
    externalDraggedOption?: string | null,
    onDropComplete?: () => void
  ) => React.ReactNode;
  examCategory?: string; // For IELTS audio restrictions
  userRole?: string; // For teacher preview
  allSections?: Section[]; // All sections for IELTS Listening multi-part view
  currentSectionIndex?: number; // Current section index in exam
  listeningPart?: number; // Current listening part (1-4)
  readingPart?: number; // Current reading part (1-3) for IELTS
  writingPart?: number; // Current writing part (1-2) for IELTS
  speakingPart?: number; // Current speaking part (1-3) for IELTS
  onListeningPartChange?: (part: number) => void; // Callback for part change
  onReadingPartChange?: (part: number) => void; // Callback for reading part change
  onWritingPartChange?: (part: number) => void; // Callback for writing part change
  onSpeakingPartChange?: (part: number) => void; // Callback for speaking part change
  /** When set, Speaking shows only this question index within current part (auto-advance mode) */
  speakingCurrentQuestionIndex?: number;
  /** Seconds left for current speaking question (for progress bar inside card) */
  speakingSecondsLeft?: number;
  /** IELTS Speaking: advance to next cue card question */
  onIELTSSpeakingNext?: () => void;
  ieltsSpeakingCanGoNext?: boolean;
  onTimeExpired?: () => void; // Callback for timer expiration
  attemptId?: string; // For localStorage timer
  onReadingTimerStateChange?: (state: { timeRemaining: number; isExpired: boolean; formatTime: (s: number) => string; getTimeColor: () => string } | null) => void; // IELTS Reading timer for sidebar
  onListeningTimerStateChange?: (state: { timeRemaining: number; isExpired: boolean; formatTime: (s: number) => string; getTimeColor: () => string } | null) => void;
  onWritingTimerStateChange?: (state: { timeRemaining: number; isExpired: boolean; formatTime: (s: number) => string; getTimeColor: () => string } | null) => void;
  onSpeakingTimerStateChange?: (state: { timeRemaining: number; isExpired: boolean; formatTime: (s: number) => string; getTimeColor: () => string } | null) => void;
  isPassageOpen?: boolean; // Whether the reading passage panel is open
  onPassageToggle?: () => void; // Toggle reading passage panel
  onIELTSSectionChange?: (sectionId: string) => void;
}

export const QuestionsArea = React.memo(function QuestionsArea({
  section,
  answers,
  isLocked,
  wordBankPositions,
  draggedOptions,
  onAnswerChange,
  onWordBankPositionChange,
  onDragStart,
  onDragEnd,
  renderQuestionComponent,
  examCategory,
  userRole,
  allSections = [],
  currentSectionIndex = 0,
  listeningPart = 1,
  readingPart = 1,
  writingPart = 1,
  speakingPart = 1,
  onListeningPartChange,
  onReadingPartChange,
  onWritingPartChange,
  onSpeakingPartChange,
  speakingCurrentQuestionIndex = 0,
  speakingSecondsLeft,
  onIELTSSpeakingNext,
  ieltsSpeakingCanGoNext,
  onTimeExpired,
  attemptId,
  onReadingTimerStateChange,
  onListeningTimerStateChange,
  onWritingTimerStateChange,
  onSpeakingTimerStateChange,
  isPassageOpen,
  onPassageToggle,
  onIELTSSectionChange,
}: QuestionsAreaProps) {
  const audioSource = section.audio || section.questions?.[0]?.prompt?.audio;
  const readingPassage =
    section.passage || section.questions?.[0]?.prompt?.passage;

  const sectionAnswers = answers[section.id] || {};

  const isIELTS = examCategory === "IELTS";
  const currentIELTSPart =
    section.type === "LISTENING"
      ? listeningPart
      : section.type === "READING"
        ? readingPart
        : section.type === "WRITING"
          ? writingPart
          : speakingPart;

  const getIELTSTimerStorageKey = useCallback(() => {
    if (!attemptId || !section.id || !isIELTS) return null;
    const keyType = String(section.type).toLowerCase();
    return `ielts_${keyType}_timer_${attemptId}_${section.id}`;
  }, [attemptId, isIELTS, section.id, section.type]);

  const [ieltsTimeRemaining, setIeltsTimeRemaining] = useState(() => {
    const duration = (section as any).durationMin || (section.type === "LISTENING" ? 30 : section.type === "READING" || section.type === "WRITING" ? 60 : 14);
    return duration * 60;
  });
  const [ieltsExpired, setIeltsExpired] = useState(false);

  useEffect(() => {
    if (!isIELTS || typeof window === "undefined") return;
    const storageKey = getIELTSTimerStorageKey();
    if (!storageKey) return;
    const duration = (section as any).durationMin || (section.type === "LISTENING" ? 30 : section.type === "READING" || section.type === "WRITING" ? 60 : 14);
    const durationMs = duration * 60 * 1000;

    const ensureEndTime = () => {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed.endTime === "number") return parsed.endTime;
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
      const endTime = Date.now() + durationMs;
      localStorage.setItem(storageKey, JSON.stringify({ startTime: Date.now(), endTime }));
      return endTime;
    };

    const endTime = ensureEndTime();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setIeltsTimeRemaining(remaining);
      setIeltsExpired(remaining === 0);
      if (remaining === 0) {
        localStorage.removeItem(storageKey);
        onTimeExpired?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [getIELTSTimerStorageKey, isIELTS, onTimeExpired, section]);

  const formatIELTSTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const ieltsTimerColor = ieltsExpired
    ? "border-red-200 bg-red-50 text-red-700"
    : ieltsTimeRemaining < 300
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-slate-200 bg-white text-slate-900";

  const getIELTSPartQuestions = () => {
    const partToken = section.type === "WRITING" ? `task${currentIELTSPart}` : `part${currentIELTSPart}`;
    const byId = section.questions.filter((q) => String(q.id).includes(partToken));
    if (byId.length > 0) return byId.sort((a, b) => a.order - b.order);

    if (section.type === "LISTENING") {
      const start = (currentIELTSPart - 1) * 10;
      const end = start + 9;
      return section.questions.filter((q) => q.order >= start && q.order <= end).sort((a, b) => a.order - b.order);
    }
    if (section.type === "READING") {
      return section.questions.filter((q) => String(q.id).includes(`part${currentIELTSPart}`)).sort((a, b) => a.order - b.order);
    }
    return section.questions.sort((a, b) => a.order - b.order);
  };

  const renderIELTSBottomTimer = () => (
    <div className={`fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 shadow-lg ${ieltsTimerColor}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Time</span>
        <span className="text-xl font-bold tabular-nums">{formatIELTSTime(ieltsTimeRemaining)}</span>
      </div>
    </div>
  );

  const renderIELTSSectionButtons = () => {
    if (!isIELTS || allSections.length === 0) return null;
    return (
      <div className="flex items-center gap-1">
        {allSections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onIELTSSectionChange?.(s.id)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              s.id === section.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>
    );
  };

  // Calculate base question numbers for DND_GAP questions
  const baseQuestionNumbers = useMemo(() => {
    const bases: Record<number, number> = {};
    let currentBase = 0;
    
    section.questions.forEach((q, idx) => {
      bases[idx] = currentBase;
      if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
        const text = q.prompt.textWithBlanks;
        let sentences: string[] = [];
        if (text.includes("\n")) {
          sentences = text.split("\n").filter((line: string) => line.trim());
        } else if (text.includes("1.") && text.includes("2.")) {
          sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
        } else {
          sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
        }
        currentBase += sentences.length;
      } else {
        currentBase += 1;
      }
    });
    
    return bases;
  }, [section.questions]);

  // "Grouped DnD" is a legacy layout for *all-DND_GAP* sections with specific titles.
  // If the section mixes other types (e.g. HTML_CSS), never group — otherwise those questions disappear.
  const isGroupedDnd =
    Array.isArray(section.questions) &&
    section.questions.length > 0 &&
    section.questions.every((q) => q.qtype === "DND_GAP") &&
    (section.title?.toLowerCase().includes("preposition") ||
      section.title?.toLowerCase().includes("time expression") ||
      section.title?.toLowerCase().includes("short form"));

  if (
    isIELTS &&
    (section.type === "LISTENING" || section.type === "READING") &&
    section.questions.some((q) => q.qtype === "HTML_CSS")
  ) {
    const filteredQuestions = getIELTSPartQuestions();
    const firstQuestion = filteredQuestions[0];
    const questionStart = filteredQuestions.length > 0 ? Math.min(...filteredQuestions.map((q) => q.order + 1)) : 0;
    const questionEnd = filteredQuestions.length > 0 ? Math.max(...filteredQuestions.map((q) => q.order + 1)) : 0;
    const maxPart = section.type === "LISTENING" ? 4 : 3;
    const activePart = section.type === "LISTENING" ? listeningPart : readingPart;
    const changePart = section.type === "LISTENING" ? onListeningPartChange : onReadingPartChange;
    const rawPassage =
      typeof section.passage === "object" && section.passage !== null
        ? (section.passage as any)[`part${readingPart}`] || ""
        : typeof section.passage === "string"
          ? section.passage
          : "";

    return (
      <div className="relative flex min-h-[calc(100vh-120px)] flex-col bg-white">
        <div className="grid flex-1 min-h-0 grid-cols-1 lg:grid-cols-[48%_52%] gap-0">
          <aside className="min-h-0 border-r border-slate-200 bg-white p-5 overflow-y-auto">
            <h2 className="text-lg font-bold uppercase text-slate-900 mb-4">
              {section.type === "LISTENING" ? `Part ${listeningPart}` : `Passage ${readingPart}`}
            </h2>

            {section.type === "LISTENING" ? (
              <div className="space-y-5">
                {audioSource ? (
                  <AudioPlayer src={audioSource} className="w-full max-w-md" />
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Audio file is not available.
                  </div>
                )}
                <details className="group rounded-md border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800">
                    Audioscript
                  </summary>
                  <div className="border-t border-slate-200 px-3 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {firstQuestion?.prompt?.transcript ? (
                      <FormattedText text={String(firstQuestion.prompt.transcript)} />
                    ) : (
                      <span className="text-slate-400">No audioscript added.</span>
                    )}
                  </div>
                </details>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-800">
                {rawPassage ? (
                  <p className="whitespace-pre-line leading-relaxed">
                    <FormattedText text={rawPassage} />
                  </p>
                ) : (
                  <p className="text-slate-400">No passage added for this part.</p>
                )}
              </div>
            )}
          </aside>

          <section className="min-h-0 overflow-y-auto bg-white p-5">
            <div className="mb-5 text-right text-xs text-emerald-700">
              Autosaved answers are stored automatically.
            </div>
            <div className="mb-5">
              <p className="text-sm font-bold text-slate-900">
                Questions {questionStart || "-"}-{questionEnd || "-"}
              </p>
              {firstQuestion?.prompt?.text && (
                <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                  <FormattedText text={String(firstQuestion.prompt.text)} />
                </p>
              )}
            </div>

            <div className="space-y-5">
              {filteredQuestions.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No questions added for this part.
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div key={q.id} className="rounded-md border border-slate-200 bg-white p-3">
                    {renderQuestionComponent(
                      q,
                      sectionAnswers[q.id],
                      (v) => onAnswerChange(q.id, v),
                      isLocked,
                      undefined,
                      undefined,
                      undefined
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          {Array.from({ length: maxPart }, (_, i) => i + 1).map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => changePart?.(part)}
              className={`min-w-10 rounded-md border px-3 py-2 text-sm font-medium ${
                activePart === part
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {part}
            </button>
          ))}
          <span className="ml-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
            {section.type === "LISTENING" ? "Listening" : "Reading"}
          </span>
          <div className="mx-2 h-8 w-px bg-slate-200" aria-hidden />
          {renderIELTSSectionButtons()}
        </div>

        {renderIELTSBottomTimer()}
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="bg-white rounded-xl mt-1 shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h2>
        </div>

        {/* IELTS Listening View */}
        {section.type === "LISTENING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSListeningView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={listeningPart}
              onPartChange={onListeningPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
              onTimerStateChange={onListeningTimerStateChange}
            />
          </div>
        )}

        {/* IELTS Reading View */}
        {section.type === "READING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSReadingView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={readingPart}
              onPartChange={onReadingPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
              onTimerStateChange={onReadingTimerStateChange}
            />
          </div>
        )}

        {/* IELTS Writing View */}
        {section.type === "WRITING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSWritingView
              section={section}
              answers={answers}
              currentPart={writingPart}
              onPartChange={onWritingPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
              allSections={allSections}
              onTimerStateChange={onWritingTimerStateChange}
            />
          </div>
        )}

        {/* IELTS Speaking View */}
        {section.type === "SPEAKING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSSpeakingView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={speakingPart}
              onPartChange={onSpeakingPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
              onTimerStateChange={onSpeakingTimerStateChange}
            />
          </div>
        )}

        {/* Regular Audio Player for non-IELTS */}
        {audioSource && !(section.type === "LISTENING" && examCategory === "IELTS") && (
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#303380" }}
              >
                🎧 Listening Audio
              </h3>
              <p
                className="text-sm"
                style={{ color: "rgba(48, 51, 128, 0.7)" }}
              >
                Listen to the audio and answer the questions below
              </p>
            </div>
            <AudioPlayer src={audioSource} className="w-full" />
          </div>
        )}

        {/* Reading Passage — hidden for IELTS Reading (shown in the right split panel instead) */}
        {readingPassage && !(section.type === "READING" && examCategory === "IELTS") && (
          <div
            className="mb-6 p-6 rounded-lg"
            style={{
              backgroundColor: "rgba(48, 51, 128, 0.05)",
              borderColor: "rgba(48, 51, 128, 0.15)",
              border: "1px solid",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#303380" }}
            >
              Reading Passage
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                <FormattedText
                  text={
                    typeof readingPassage === "object" && readingPassage !== null
                      ? (readingPassage as any)[`part${readingPart}`] || ""
                      : String(readingPassage ?? "")
                  }
                />
              </p>
            </div>
          </div>
        )}

        {/* Grouped DnD */}
        {isGroupedDnd ? (
          <div
            className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: "rgba(15, 17, 80, 0.63)",
            }}
          >
            <div className="p-6">
              <QDndGroup
                questions={section.questions}
                values={sectionAnswers}
                onChange={(qid, v) => onAnswerChange(qid, v)}
                readOnly={isLocked}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {(() => {
              // Filter questions based on section type and part
              let filteredQuestions = section.questions;
              
              if (section.type === "LISTENING" && examCategory === "IELTS") {
                // Filter questions by selected part (order is 0-based)
                filteredQuestions = section.questions.filter((q) => {
                  if (listeningPart === 1) return q.order >= 0 && q.order <= 9;
                  if (listeningPart === 2) return q.order >= 10 && q.order <= 19;
                  if (listeningPart === 3) return q.order >= 20 && q.order <= 29;
                  if (listeningPart === 4) return q.order >= 30 && q.order <= 39;
                  return true;
                }).sort((a, b) => a.order - b.order);
              } else if (section.type === "READING" && examCategory === "IELTS") {
                filteredQuestions = [...section.questions].sort((a, b) => a.order - b.order);
              } else if (section.type === "WRITING" && examCategory === "IELTS") {
                // For Writing, if section has multiple questions, filter by order
                // Task 1 is typically order 0, Task 2 is order 1
                if (section.questions.length > 1) {
                  filteredQuestions = section.questions.filter((q) => {
                    if (writingPart === 1) return q.order === 0;
                    if (writingPart === 2) return q.order === 1;
                    return true;
                  });
                } else {
                  // Single question section - show all (panel will show progress)
                  filteredQuestions = section.questions;
                }
              } else if (section.type === "SPEAKING" && examCategory === "IELTS") {
                // For Speaking, filter by prompt.part
                filteredQuestions = section.questions.filter((q) => {
                  const part = q.prompt?.part;
                  if (part === speakingPart) return true;
                  const promptText = q.prompt?.text?.toLowerCase() || "";
                  if (speakingPart === 1 && (promptText.includes("part 1") || promptText.includes("part1"))) return true;
                  if (speakingPart === 2 && (promptText.includes("part 2") || promptText.includes("part2"))) return true;
                  if (speakingPart === 3 && (promptText.includes("part 3") || promptText.includes("part3"))) return true;
                  if (!part && !promptText.includes("part")) {
                    const totalQuestions = section.questions.length;
                    if (speakingPart === 1 && q.order < totalQuestions / 3) return true;
                    if (speakingPart === 2 && q.order >= totalQuestions / 3 && q.order < (totalQuestions * 2) / 3) return true;
                    if (speakingPart === 3 && q.order >= (totalQuestions * 2) / 3) return true;
                  }
                  return false;
                }).sort((a, b) => a.order - b.order);
                // Auto-advance mode: show only the single question at speakingCurrentQuestionIndex
                if (typeof speakingCurrentQuestionIndex === "number" && speakingCurrentQuestionIndex >= 0) {
                  const at = speakingCurrentQuestionIndex;
                  filteredQuestions = filteredQuestions[at] != null ? [filteredQuestions[at]] : filteredQuestions;
                }
              }
              
              return filteredQuestions;
            })().map((q, idx) => {
              const value = sectionAnswers[q.id];
              // For IELTS Listening and Reading, use the actual question order number
              let baseQuestionNum = 0;
              if ((section.type === "LISTENING" || section.type === "READING") && examCategory === "IELTS") {
                // Use actual order number + 1 (order is 0-based, but questions are 1-based)
                // Q1 has order 0, Q2 has order 1, etc.
                baseQuestionNum = q.order + 1;
              } else {
                baseQuestionNum = baseQuestionNumbers[idx] || 0;
              }

              // DND_GAP special handling
              if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
                const wordBankPosition =
                  wordBankPositions[q.id] !== undefined
                    ? wordBankPositions[q.id]
                    : (() => {
                        const text = q.prompt.textWithBlanks;
                        let sentences: string[] = [];
                        if (text.includes("\n")) {
                          sentences = text.split("\n").filter((line: string) => line.trim());
                        } else if (text.includes("1.") && text.includes("2.")) {
                          sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
                        } else {
                          sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
                        }
                        return sentences.length - 1;
                      })();

                return (
                  <DndGapQuestion
                    key={q.id}
                    question={q}
                    value={value}
                    onChange={(v) => onAnswerChange(q.id, v)}
                    isLocked={isLocked}
                    baseQuestionNum={baseQuestionNum}
                    wordBankPosition={wordBankPosition}
                    onWordBankPositionChange={(pos) =>
                      onWordBankPositionChange(q.id, pos)
                    }
                    draggedOption={draggedOptions[q.id] || null}
                    onDragStart={(label, e) => onDragStart(q.id, label, e)}
                    onDragEnd={() => onDragEnd(q.id)}
                    onDropComplete={() => onDragEnd(q.id)}
                    renderQuestionComponent={(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete) => 
                      renderQuestionComponent(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete, section.type)
                    }
                  />
                );
              }

              const isSpeakingWithBar =
                section.type === "SPEAKING" &&
                examCategory === "IELTS" &&
                q.qtype === "SPEAKING_RECORDING" &&
                typeof speakingSecondsLeft === "number" &&
                speakingSecondsLeft >= 0;
              const speakingTotalSeconds = totalSecondsForSpeakingPart(speakingPart);
              const elapsed = Math.max(0, speakingTotalSeconds - speakingSecondsLeft!);
              const fillPercent = Math.min(
                100,
                (elapsed / Math.max(1, speakingTotalSeconds)) * 100
              );
              const markerPct = recordingMarkerPercent(speakingPart);
              const inPrep = isSpeakingPrepPhase(speakingPart, speakingSecondsLeft!);
              const prepSec = prepSecondsForSpeakingPart(speakingPart);
              const phaseTitle =
                speakingPart === 1
                  ? inPrep
                    ? "Thinking time"
                    : "Recording"
                  : inPrep
                    ? "Preparation"
                    : "Recording";
              const speakDur = speakingTotalSeconds - prepSec;
              const speakHint =
                speakDur % 60 === 0
                  ? `${speakDur / 60} min`
                  : speakDur >= 60
                    ? `${Math.floor(speakDur / 60)} min ${speakDur % 60}s`
                    : `${speakDur}s`;
              const phaseHint =
                speakingPart === 1
                  ? inPrep
                    ? `${prepSec}s to think before the microphone turns on`
                    : "Answer the question — recording is on"
                  : inPrep
                    ? `${prepSec}s to prepare — then speak for ${speakHint}`
                    : "Speak until time ends or tap Next";

              const fmt = (s: number) =>
                `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

              const speakingFooterSlot =
                isSpeakingWithBar ? (
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {phaseTitle}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{phaseHint}</p>
                      </div>
                      <div
                        className="tabular-nums text-2xl font-bold tracking-tight"
                        style={{ color: "#303380" }}
                      >
                        {fmt(speakingSecondsLeft!)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative min-h-10 flex-1 flex items-center">
                        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-slate-200/90 shadow-inner" />
                        <div
                          className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full transition-all duration-1000 ease-linear"
                          style={{
                            width: `${fillPercent}%`,
                            background: inPrep
                              ? "linear-gradient(90deg,#64748b,#475569)"
                              : "linear-gradient(90deg,#303380,#5b5fb8)",
                          }}
                        />
                        <div
                          className="absolute top-1/2 z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-violet-600 shadow-md ring-2 ring-violet-200/80"
                          style={{ left: `${markerPct}%` }}
                          title="Recording starts here"
                          aria-hidden
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onIELTSSpeakingNext?.()}
                        disabled={!ieltsSpeakingCanGoNext}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ backgroundColor: "#303380" }}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Dot marks when recording begins. Use Next when you are finished or time is up.
                    </p>
                  </div>
                ) : undefined;

              // Regular question
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  value={value}
                  onChange={(v) => onAnswerChange(q.id, v)}
                  isLocked={isLocked}
                  questionNumber={(section.type === "LISTENING" || section.type === "READING") && examCategory === "IELTS" ? baseQuestionNum : baseQuestionNum + 1}
                  renderQuestionComponent={(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete) => 
                    renderQuestionComponent(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete, section.type)
                  }
                  footerSlot={speakingFooterSlot}
                />
              );
            })}
          </div>
        )}
      </div>
      {isIELTS && (
        <>
          <div className="sticky bottom-0 mt-4 flex items-center justify-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            {renderIELTSSectionButtons()}
          </div>
          {renderIELTSBottomTimer()}
        </>
      )}
    </div>
  );
});

