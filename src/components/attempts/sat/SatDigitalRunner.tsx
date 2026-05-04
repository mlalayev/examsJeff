"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Bookmark,
  Pencil,
  Strikethrough,
  ChevronRight,
} from "lucide-react";
import FormattedText from "@/components/FormattedText";

type Question = {
  id: string;
  qtype: string;
  prompt: any;
  options?: any;
  order: number;
  maxScore?: number;
};

type Section = {
  id: string;
  type: string;
  title: string;
  durationMin: number;
  order: number;
  instruction?: string;
  passage?: string | null;
  questions: Question[];
};

type AttemptPayload = {
  id: string;
  examTitle: string;
  examCategory?: string;
  status: string;
  sections: Section[];
  savedAnswers: Record<string, Record<string, any>>;
  sectionStartTimes?: Record<string, number>;
};

function answersStorageKey(attemptId: string) {
  return `exam_answers_${attemptId}`;
}

function satTimerKey(attemptId: string, sectionId: string) {
  return `sat_timer_${attemptId}_${sectionId}`;
}

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isBreakSection(section: Section) {
  return (
    section.questions.length === 0 ||
    section.title.toLowerCase().includes("break")
  );
}

function promptText(q: Question): string {
  const t = q.prompt?.text;
  return typeof t === "string" ? t : "";
}

type Props = {
  attemptId: string;
  onUnauthorized?: () => void;
  onLoadError?: () => void;
};

export function SatDigitalRunner({
  attemptId,
  onUnauthorized,
  onLoadError,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttemptPayload | null>(null);
  const [moduleIndex, setModuleIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<string, any>>>(
    {}
  );
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [eliminated, setEliminated] = useState<Record<string, Set<number>>>({});
  const [showTimer, setShowTimer] = useState(true);
  const [annotateMode, setAnnotateMode] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [lockedModules, setLockedModules] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitExam, setShowSubmitExam] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const expireHandledRef = useRef<string | null>(null);

  const sortedSections = useMemo(() => {
    if (!data?.sections) return [];
    return [...data.sections].sort((a, b) => a.order - b.order);
  }, [data?.sections]);

  useEffect(() => {
    setQIndex(0);
  }, [moduleIndex]);

  const currentSection = sortedSections[moduleIndex] ?? null;
  const isBreak = currentSection ? isBreakSection(currentSection) : false;
  const questions = currentSection?.questions ?? [];
  const currentQuestion = questions[qIndex] ?? null;

  const reviewKey = currentQuestion
    ? `${currentSection!.id}:${currentQuestion.id}`
    : "";

  const loadAttempt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = (await res.json()) as AttemptPayload & { error?: string };
      if (res.status === 401 || res.status === 403) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) throw new Error(json.error || "Failed to load");

      if (json.status === "SUBMITTED" || json.status === "COMPLETED") {
        router.replace(`/attempts/${attemptId}/results`);
        return;
      }

      if (json.examCategory && json.examCategory !== "SAT") {
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

      if (json.savedAnswers && json.sections) {
        for (const s of json.sections) {
          const fromServer = json.savedAnswers[s.type];
          if (fromServer) {
            loaded[s.id] = { ...(loaded[s.id] || {}), ...fromServer };
          }
        }
      }

      setData(json);
      setAnswers(loaded);
      if (typeof window !== "undefined" && Object.keys(loaded).length > 0) {
        localStorage.setItem(
          answersStorageKey(attemptId),
          JSON.stringify(loaded)
        );
      }

      setModuleIndex(0);
      setQIndex(0);
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

  const saveSection = useCallback(
    async (section: Section, sectionAnswers: Record<string, any>) => {
      const res = await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType: section.type,
          answers: sectionAnswers,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn("Save failed", j);
      }
    },
    [attemptId]
  );

  const persistLocal = useCallback(
    (next: Record<string, Record<string, any>>) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          answersStorageKey(attemptId),
          JSON.stringify(next)
        );
      }
    },
    [attemptId]
  );

  const scheduleAutosave = useCallback(
    (section: Section) => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      if (isBreakSection(section)) return;
      autosaveRef.current = setTimeout(() => {
        saveSection(section, answersRef.current[section.id] || {});
      }, 2000);
    },
    [saveSection]
  );

  const setAnswer = (questionId: string, value: any) => {
    if (!currentSection || lockedModules.has(currentSection.id)) return;
    setAnswers((prev) => {
      const next = {
        ...prev,
        [currentSection.id]: {
          ...(prev[currentSection.id] || {}),
          [questionId]: value,
        },
      };
      persistLocal(next);
      scheduleAutosave(currentSection);
      return next;
    });
  };

  useEffect(() => {
    expireHandledRef.current = null;
    if (!currentSection || isBreak) {
      setSecondsLeft(null);
      return;
    }
    const dur = Math.max(1, currentSection.durationMin) * 60;
    const key = satTimerKey(attemptId, currentSection.id);
    let end = 0;
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const { endTime } = JSON.parse(raw) as { endTime: number };
          if (endTime > Date.now()) end = endTime;
        } catch {
          localStorage.removeItem(key);
        }
      }
      if (!end) {
        end = Date.now() + dur * 1000;
        localStorage.setItem(
          key,
          JSON.stringify({ startTime: Date.now(), endTime: end })
        );
      }
    } else {
      end = Date.now() + dur * 1000;
    }

    const sectionId = currentSection.id;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (
        left <= 0 &&
        currentSection &&
        expireHandledRef.current !== sectionId
      ) {
        expireHandledRef.current = sectionId;
        void saveSection(
          currentSection,
          answersRef.current[currentSection.id] || {}
        );
        setLockedModules((prev) => new Set([...prev, currentSection.id]));
        setModuleIndex((i) =>
          i < sortedSections.length - 1 ? i + 1 : i
        );
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    currentSection,
    isBreak,
    attemptId,
    sortedSections.length,
    saveSection,
  ]);

  const toggleEliminated = (qid: string, choiceIdx: number) => {
    setEliminated((prev) => {
      const set = new Set(prev[qid] || []);
      if (set.has(choiceIdx)) set.delete(choiceIdx);
      else set.add(choiceIdx);
      return { ...prev, [qid]: set };
    });
  };

  const handleSubmitModule = async () => {
    if (!currentSection || isBreak) return;
    await saveSection(currentSection, answers[currentSection.id] || {});
    if (typeof window !== "undefined") {
      localStorage.removeItem(satTimerKey(attemptId, currentSection.id));
    }
    setLockedModules((prev) => new Set([...prev, currentSection.id]));
    if (moduleIndex < sortedSections.length - 1) {
      setModuleIndex((i) => i + 1);
      setQIndex(0);
    } else {
      setShowSubmitExam(true);
    }
  };

  const handleSubmitExamConfirm = async () => {
    setShowSubmitExam(false);
    setSubmitting(true);
    try {
      for (const s of sortedSections) {
        if (isBreakSection(s)) continue;
        await saveSection(s, answers[s.id] || {});
      }
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Submit failed");
      if (typeof window !== "undefined") {
        localStorage.removeItem(answersStorageKey(attemptId));
        for (const s of sortedSections) {
          localStorage.removeItem(satTimerKey(attemptId, s.id));
        }
      }
      router.replace(`/attempts/${attemptId}/results`);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const dashedRule = (
    <div
      className="h-px w-full my-3"
      style={{
        background:
          "repeating-linear-gradient(90deg, #9ca3af 0 8px, #3b82f6 8px 16px, #eab308 16px 24px)",
      }}
    />
  );

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-600">
        Loading…
      </div>
    );
  }

  const passageText =
    currentSection?.passage ||
    (questions[0]?.prompt?.passage as string | undefined) ||
    "";

  return (
    <div
      className={`min-h-screen flex flex-col bg-white text-slate-900 ${
        annotateMode ? "selection:bg-amber-200" : ""
      }`}
    >
      <header className="shrink-0 px-6 pt-4 pb-1">
        <div className="max-w-[1400px] mx-auto flex items-start justify-between gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setDirectionsOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-800 border border-slate-300 rounded-md px-3 py-2 bg-white hover:bg-slate-50"
            >
              Directions
              <ChevronDown className="w-4 h-4" />
            </button>
            {directionsOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 w-[min(100vw-3rem,420px)] rounded-lg border border-slate-200 bg-white shadow-lg p-4 text-sm text-slate-700">
                <p className="mb-2">
                  Work each problem in this module. You may use the on-screen
                  calculator where allowed. When you finish this module, submit
                  it; you will not be able to return to it.
                </p>
                <button
                  type="button"
                  className="text-blue-600 font-medium"
                  onClick={() => setDirectionsOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            {showTimer && secondsLeft !== null && !isBreak && (
              <div className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
                {formatCountdown(secondsLeft)}
              </div>
            )}
            {isBreak && (
              <div className="text-2xl font-semibold tabular-nums text-slate-900">
                Break — up to {currentSection?.durationMin ?? 10} min
              </div>
            )}
            {!isBreak && (
              <button
                type="button"
                onClick={() => setShowTimer((v) => !v)}
                className="mt-1 text-xs font-medium rounded-full border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
              >
                {showTimer ? "Hide" : "Show"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAnnotateMode((v) => !v)}
            className={`inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 border ${
              annotateMode
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Pencil className="w-4 h-4" />
            Annotate
          </button>
        </div>
        {dashedRule}
      </header>

      <main className="flex-1 min-h-0 flex flex-col px-6 pb-4">
        {isBreak && currentSection ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center gap-6 py-16">
            <h2 className="text-xl font-semibold text-slate-900">
              {currentSection.title}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Take a short break. When you are ready to continue to the next
              part, press Continue.
            </p>
            <button
              type="button"
              onClick={() => {
                setModuleIndex((i) => Math.min(i + 1, sortedSections.length - 1));
                setQIndex(0);
              }}
              className="rounded-full bg-slate-900 text-white px-8 py-3 text-sm font-semibold hover:bg-slate-800"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 max-w-[1400px] mx-auto w-full flex gap-0 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div
              className={`w-1/2 min-w-0 border-r border-slate-200 bg-slate-50/80 overflow-y-auto p-6 text-[15px] leading-relaxed text-slate-800 ${
                annotateMode ? "[&::selection]:bg-amber-200" : ""
              }`}
            >
              {passageText ? (
                <FormattedText text={passageText} />
              ) : (
                <p className="text-slate-500 text-sm">No passage for this item.</p>
              )}
            </div>
            <div className="w-1/2 min-w-0 flex flex-col bg-white overflow-y-auto">
              {currentQuestion && currentSection && (
                <div className="p-6 flex flex-col flex-1 min-h-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-slate-900 text-white text-sm font-semibold flex items-center justify-center rounded">
                      {qIndex + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMarked((prev) => {
                          const n = new Set(prev);
                          if (n.has(reviewKey)) n.delete(reviewKey);
                          else n.add(reviewKey);
                          return n;
                        });
                      }}
                      className={`inline-flex items-center gap-2 text-sm font-medium rounded-md px-3 py-2 border ${
                        marked.has(reviewKey)
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-300 text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      Mark for Review
                    </button>
                  </div>
                  {dashedRule}
                  {promptText(currentQuestion) && (
                    <p className="mt-4 text-[15px] text-slate-900 leading-relaxed">
                      <FormattedText text={promptText(currentQuestion)} />
                    </p>
                  )}
                  {currentQuestion.qtype === "MCQ_SINGLE" && (
                    <div className="mt-6 space-y-3 flex-1">
                      {(currentQuestion.options?.choices || []).map(
                        (choice: string, idx: number) => {
                          const val =
                            answers[currentSection.id]?.[currentQuestion.id];
                          const selected = val === idx;
                          const crossed =
                            eliminated[currentQuestion.id]?.has(idx) ?? false;
                          return (
                            <div
                              key={idx}
                              className={`flex items-stretch gap-2 rounded-lg border transition-colors ${
                                selected
                                  ? "border-blue-600 ring-1 ring-blue-600 bg-blue-50/60"
                                  : crossed
                                  ? "border-slate-200 bg-slate-100 opacity-70"
                                  : "border-slate-300 bg-white hover:border-slate-400"
                              }`}
                            >
                              <button
                                type="button"
                                disabled={
                                  lockedModules.has(currentSection.id) || crossed
                                }
                                onClick={() =>
                                  setAnswer(currentQuestion.id, idx)
                                }
                                className="flex-1 text-left px-4 py-3 flex gap-3 min-w-0"
                              >
                                <span className="font-semibold text-slate-700 shrink-0">
                                  {String.fromCharCode(65 + idx)}:
                                </span>
                                <span className="text-[15px] text-slate-900">
                                  <FormattedText text={choice} />
                                </span>
                              </button>
                              <button
                                type="button"
                                title="Eliminate answer"
                                onClick={() =>
                                  toggleEliminated(currentQuestion.id, idx)
                                }
                                className="shrink-0 px-3 flex items-center border-l border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                              >
                                <Strikethrough className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                  {currentQuestion.qtype !== "MCQ_SINGLE" && (
                    <p className="mt-6 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      This sample UI currently supports multiple choice (single)
                      for SAT Digital. Question type: {currentQuestion.qtype}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="shrink-0 px-6 pb-6 pt-2">
        {dashedRule}
        <div className="max-w-[1400px] mx-auto grid grid-cols-3 items-center gap-4 pt-2">
          <div />
          <div className="flex justify-center">
            {!isBreak && questions.length > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white pl-4 pr-2 py-2 text-sm font-medium">
                <span>
                  Question {qIndex + 1} of {questions.length}
                </span>
                {questions.length > 1 && (
                  <select
                    className="bg-slate-800 text-white text-sm font-medium border-0 rounded-md cursor-pointer px-2 py-1 ml-1 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={qIndex}
                    onChange={(e) => setQIndex(Number(e.target.value))}
                    aria-label="Jump to question"
                  >
                    {questions.map((_, i) => (
                      <option key={i} value={i}>
                        Question {i + 1}
                      </option>
                    ))}
                  </select>
                )}
                {questions.length > 1 && (
                  <ChevronDown className="w-4 h-4 shrink-0 opacity-90 pointer-events-none -ml-4" />
                )}
              </div>
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isBreak || qIndex <= 0}
              onClick={() => setQIndex((i) => Math.max(0, i - 1))}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-sky-100 text-sky-900 hover:bg-sky-200 disabled:opacity-40 disabled:pointer-events-none"
            >
              Back
            </button>
            {!isBreak && questions.length > 0 && (
              <>
                {qIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    disabled={lockedModules.has(currentSection!.id)}
                    onClick={() =>
                      setQIndex((i) =>
                        Math.min(questions.length - 1, i + 1)
                      )
                    }
                    className="inline-flex items-center gap-1 px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={
                      lockedModules.has(currentSection!.id) || submitting
                    }
                    onClick={() => {
                      if (moduleIndex === sortedSections.length - 1) {
                        setShowSubmitExam(true);
                      } else {
                        void handleSubmitModule();
                      }
                    }}
                    className="inline-flex items-center gap-1 px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    {moduleIndex === sortedSections.length - 1
                      ? "Submit exam"
                      : "Submit module"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </footer>

      {showSubmitExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Submit entire exam?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              You will not be able to change your answers after submitting.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50"
                onClick={() => setShowSubmitExam(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={() => void handleSubmitExamConfirm()}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
