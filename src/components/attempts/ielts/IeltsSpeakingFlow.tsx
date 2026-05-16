"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { QSpeakingRecording } from "@/components/questions/QSpeakingRecording";
import { SpeakingIntroModal } from "@/components/attempts/modals/SpeakingIntroModal";
import {
  groupSpeakingQuestionsByPart,
  questionsForSpeakingPart,
  type SpeakingQuestion,
} from "@/lib/ielts-speaking-questions";
import {
  isSpeakingPrepPhase,
  prepSecondsForSpeakingPart,
  recordingMarkerPercent,
  totalSecondsForSpeakingPart,
} from "@/lib/ielts-speaking-timers";

type Props = {
  attemptId: string;
  sectionId: string;
  questions: SpeakingQuestion[];
  answers: Record<string, unknown>;
  onAnswerChange: (questionId: string, value: string) => void;
  activePart: number;
  onActivePartChange: (part: number) => void;
};

export function IeltsSpeakingFlow({
  attemptId,
  sectionId,
  questions,
  answers,
  onAnswerChange,
  activePart,
  onActivePartChange,
}: Props) {
  const introKey = `ielts_speaking_intro_seen_${attemptId}`;
  const [introDismissed, setIntroDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(introKey) === "1";
  });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    totalSecondsForSpeakingPart(activePart),
  );

  const grouped = useMemo(
    () => groupSpeakingQuestionsByPart(questions),
    [questions],
  );

  const partQuestions = useMemo(
    () => questionsForSpeakingPart(grouped, activePart),
    [grouped, activePart],
  );

  const currentQuestion = partQuestions[questionIndex] ?? null;

  const dismissIntro = () => {
    setIntroDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(introKey, "1");
    }
  };

  const advanceQuestion = useCallback(() => {
    if (questionIndex + 1 < partQuestions.length) {
      setQuestionIndex((i) => i + 1);
      return;
    }
    if (activePart === 1) {
      if (grouped.part2.length > 0) {
        onActivePartChange(2);
        setQuestionIndex(0);
        return;
      }
      if (grouped.part3.length > 0) {
        onActivePartChange(3);
        setQuestionIndex(0);
        return;
      }
    }
    if (activePart === 2 && grouped.part3.length > 0) {
      onActivePartChange(3);
      setQuestionIndex(0);
    }
  }, [
    questionIndex,
    partQuestions.length,
    activePart,
    grouped.part2.length,
    grouped.part3.length,
    onActivePartChange,
  ]);

  useEffect(() => {
    if (!introDismissed) return;
    setSecondsLeft(totalSecondsForSpeakingPart(activePart));
  }, [activePart, questionIndex, introDismissed, sectionId]);

  useEffect(() => {
    if (!introDismissed) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [introDismissed, sectionId, activePart, questionIndex]);

  useEffect(() => {
    const maxIdx = Math.max(0, partQuestions.length - 1);
    if (questionIndex > maxIdx) setQuestionIndex(maxIdx);
  }, [partQuestions.length, questionIndex]);

  useEffect(() => {
    setQuestionIndex(0);
  }, [activePart]);

  if (!introDismissed) {
    return (
      <>
        <div className="h-full flex items-center justify-center p-6 text-sm text-slate-500">
          Read the instructions in the modal to begin the speaking section.
        </div>
        <SpeakingIntroModal isOpen onClose={dismissIntro} />
      </>
    );
  }

  if (partQuestions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-slate-500">
        No questions in Part {activePart} yet.
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-slate-500">
        No more questions in this part.
      </div>
    );
  }

  const totalSeconds = totalSecondsForSpeakingPart(activePart);
  const elapsed = Math.max(0, totalSeconds - secondsLeft);
  const fillPercent = Math.min(100, (elapsed / Math.max(1, totalSeconds)) * 100);
  const markerPct = recordingMarkerPercent(activePart);
  const inPrep = isSpeakingPrepPhase(activePart, secondsLeft);
  const prepSec = prepSecondsForSpeakingPart(activePart);
  const speakDur = totalSeconds - prepSec;
  const speakHint =
    speakDur % 60 === 0
      ? `${speakDur / 60} min`
      : speakDur >= 60
        ? `${Math.floor(speakDur / 60)} min ${speakDur % 60}s`
        : `${speakDur}s`;
  const phaseTitle =
    activePart === 1
      ? inPrep
        ? "Thinking time"
        : "Recording"
      : inPrep
        ? "Preparation"
        : "Recording";
  const phaseHint =
    activePart === 1
      ? inPrep
        ? `${prepSec}s to think before the microphone turns on`
        : "Answer the question — recording is on"
      : inPrep
        ? `${prepSec}s to prepare — then speak for ${speakHint}`
        : "Speak until time ends or tap Next";
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const answerValue = answers[currentQuestion.id];
  const textAnswer = typeof answerValue === "string" ? answerValue : "";

  return (
    <div className="h-full overflow-y-auto max-w-[980px] mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Part {activePart} · Question {questionIndex + 1} of {partQuestions.length}
        </span>
        <span>
          P1 {grouped.part1.length} · P2 {grouped.part2.length} · P3 {grouped.part3.length}
        </span>
      </div>

      <QSpeakingRecording
        key={`${currentQuestion.id}-${activePart}-${questionIndex}`}
        question={currentQuestion as Parameters<typeof QSpeakingRecording>[0]["question"]}
        value={textAnswer}
        onChange={(v) => onAnswerChange(currentQuestion.id, v)}
        readOnly={false}
        attemptId={attemptId}
        speakingPart={activePart}
        questionSecondsLeft={secondsLeft}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {phaseTitle}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{phaseHint}</p>
          </div>
          <div className="tabular-nums text-2xl font-bold tracking-tight text-[#303380]">
            {fmt(secondsLeft)}
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
            onClick={advanceQuestion}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm bg-[#303380] hover:bg-[#252a6b]"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="text-[10px] text-slate-400">
          Dot marks when recording begins. Use Next when you are finished or time is up.
        </p>
      </div>
    </div>
  );
}
