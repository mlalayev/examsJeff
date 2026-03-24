"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Clock, AlertCircle, Loader2 } from "lucide-react";

interface QSpeakingRecordingProps {
  question: {
    id: string;
    prompt: {
      text: string;
      part?: number;
    };
  };
  value?: string; // Now stores TEXT not audio URL
  onChange?: (value: string) => void; // Now passes TEXT
  readOnly?: boolean;
  attemptId?: string;
  speakingPart?: number;
  onRecordingComplete?: () => void;
  autoStart?: boolean;
  /** When set (IELTS attempt run page), timer UI matches the footer "Time for this question" — single source of truth */
  questionSecondsLeft?: number;
  /** Callback to skip to next question early */
  onSkipToNext?: () => void;
}

// Timer durations based on part
const RECORDING_DURATIONS = {
  1: 50,   // Part 1: 50 seconds (was 34, +16 more)
  2: 120,  // Part 2: 2 minutes (120 seconds) speaking (was 180, now 60s prep + 120s speaking = 180 total)
  3: 90,   // Part 3: 1 minute 30 seconds (90 seconds, was 60, +30 more)
};

const PREPARATION_DURATION = 60; // Part 2 only: 1 minute prep

/** Must match `run/page.tsx` + QuestionsArea footer totals */
function questionTotalSecondsForPart(part: number): number {
  if (part === 1) return 50;
  if (part === 2) return 120;
  return 90;
}

export function QSpeakingRecording({
  question,
  value = "",
  onChange,
  readOnly = false,
  attemptId,
  speakingPart,
  onRecordingComplete,
  autoStart = false,
  questionSecondsLeft,
  onSkipToNext,
}: QSpeakingRecordingProps) {
  const part = speakingPart || question.prompt.part || 1;
  const recordingDuration = RECORDING_DURATIONS[part as keyof typeof RECORDING_DURATIONS] || 30;
  const hasPreparation = part === 2;
  const useParentTimer = typeof questionSecondsLeft === "number";
  const questionTotalSeconds = questionTotalSecondsForPart(part);

  const [status, setStatus] = useState<"idle" | "preparing" | "reading" | "recording" | "transcribing" | "completed">("idle");
  const [timeLeft, setTimeLeft] = useState(hasPreparation ? PREPARATION_DURATION : recordingDuration);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef<boolean>(false); // Prevent double-start in StrictMode
  /** Decrement source of truth — avoids Strict Mode double-invoking `setState(prev => prev - 1)` and skipping 2s per tick */
  const timeLeftRef = useRef(hasPreparation ? PREPARATION_DURATION : recordingDuration);

  const clearPhaseTimeout = () => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearPhaseTimeout();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startPreparation = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearPhaseTimeout();

    setStatus("preparing");
    timeLeftRef.current = PREPARATION_DURATION;
    setTimeLeft(PREPARATION_DURATION);
    setError(null);

    if (useParentTimer) {
      phaseTimeoutRef.current = setTimeout(() => {
        phaseTimeoutRef.current = null;
        setTimeout(() => startReading(), 500);
      }, PREPARATION_DURATION * 1000);
      return;
    }

    timerRef.current = setInterval(() => {
      const next = timeLeftRef.current - 1;
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (next <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimeout(() => startReading(), 500);
      }
    }, 1000);
  };

  const startReading = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearPhaseTimeout();

    setStatus("reading");
    timeLeftRef.current = 3;
    setTimeLeft(3);
    setError(null);

    if (useParentTimer) {
      phaseTimeoutRef.current = setTimeout(() => {
        phaseTimeoutRef.current = null;
        setTimeout(() => startRecording(), 500);
      }, 3000);
      return;
    }

    timerRef.current = setInterval(() => {
      const next = timeLeftRef.current - 1;
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (next <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimeout(() => startRecording(), 500);
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      clearPhaseTimeout();

      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await transcribeAudio();
      };

      mediaRecorder.start();
      setStatus("recording");
      timeLeftRef.current = recordingDuration;
      setTimeLeft(recordingDuration);

      if (!useParentTimer) {
        timerRef.current = setInterval(() => {
          const next = timeLeftRef.current - 1;
          timeLeftRef.current = next;
          setTimeLeft(next);
          if (next <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            stopRecording();
          }
        }, 1000);
      }

    } catch (err: any) {
      console.error("Microphone access error:", err);
      
      let errorMessage = "Microphone access denied. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow microphone access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Microphone is being used by another application.";
      } else {
        errorMessage += "Please check your browser settings.";
      }
      
      setError(errorMessage);
      setStatus("idle");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!useParentTimer) return;
    if (status !== "recording") return;
    if ((questionSecondsLeft ?? 1) > 0) return;
    stopRecording();
  }, [useParentTimer, questionSecondsLeft, status, stopRecording]);

  const transcribeAudio = async () => {
    setStatus("transcribing");

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      
      const formData = new FormData();
      formData.append("file", audioBlob, `speaking-${question.id}.webm`);
      formData.append("questionId", question.id);

      const response = await fetch(`/api/attempts/${attemptId}/speaking/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data = await response.json();

      if (onChange) {
        onChange(data.text || "");
      }

      setStatus("completed");
      
      if (onRecordingComplete) {
        onRecordingComplete();
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(`Transcription failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("idle");
    }
  };

  const handleStart = () => {
    // Prevent double-start
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    if (hasPreparation) {
      startPreparation();
    } else {
      startReading();
    }
  };

  useEffect(() => {
    // Auto-start recording when component mounts
    if (status === "idle" && !value && !readOnly && !hasStartedRef.current) {
      const timer = setTimeout(() => {
        handleStart();
      }, 500);
      return () => {
        clearTimeout(timer);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        clearPhaseTimeout();
      };
    }
  }, []); // Empty deps - only run once on mount

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSpeakingPrompt = (text: string): React.ReactNode => {
    if (!text || typeof text !== "string") return "Speaking question";
    const trimmed = text.trim();

    const sayIndex = trimmed.search(/\bYou should say\s*:/i);
    if (sayIndex === -1) {
      const cleaned = trimmed.replace(/__([^_]*?)__/g, "$1");
      return <p className="text-sm text-gray-800 whitespace-pre-line">{cleaned}</p>;
    }

    const mainPart = trimmed.slice(0, sayIndex).trim();
    const rest = trimmed.slice(sayIndex).trim();
    const afterLabel = rest.replace(/^You should say\s*:\s*/i, "").trim();
    const rawBullets = afterLabel.split(/\s*-\s*/).map((s) => s.trim()).filter(Boolean);
    const bullets = rawBullets.map((b) => b.replace(/^__|__$/g, "").replace(/__/g, " ").trim());

    return (
      <div className="space-y-3">
        {mainPart && (
          <p className="text-base font-semibold text-gray-900 leading-snug">
            {mainPart.replace(/\*\*/g, "").trim()}
          </p>
        )}
        {bullets.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              You should say:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700">
              {bullets.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // If completed with text answer - show question + answer
  if (value && value.trim()) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          {formatSpeakingPrompt(question.prompt?.text || "Speaking question")}
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Your Answer (Transcribed):</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{value}</p>
        </div>
      </div>
    );
  }

  // Show recording status
  if (status !== "idle") {
    const displaySeconds = useParentTimer
      ? Math.max(0, questionSecondsLeft ?? 0)
      : timeLeft;
    const recordingBarPercent = useParentTimer
      ? Math.max(
          0,
          Math.min(
            100,
            ((questionTotalSeconds - displaySeconds) / questionTotalSeconds) * 100
          )
        )
      : Math.max(0, Math.min(100, ((recordingDuration - timeLeft) / recordingDuration) * 100));
    const recordingBarColor =
      useParentTimer && displaySeconds < 30 ? "#dc2626" : useParentTimer ? "#303380" : undefined;

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          {formatSpeakingPrompt(question.prompt?.text || "Speaking question")}
        </div>

        <div className="rounded-lg border border-[#303380] bg-[#303380]/5 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {status === "preparing" && (
                <>
                  <Clock className="w-5 h-5 text-[#303380]" />
                  <span className="text-sm font-medium text-[#303380]">Preparation Time</span>
                </>
              )}
              {status === "reading" && (
                <>
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Get Ready...</span>
                </>
              )}
              {status === "recording" && (
                <>
                  <Mic className="w-5 h-5 text-red-600 animate-pulse" />
                  <span className="text-sm font-medium text-red-600">Recording...</span>
                </>
              )}
              {status === "transcribing" && (
                <>
                  <Loader2 className="w-5 h-5 text-[#303380] animate-spin" />
                  <span className="text-sm font-medium text-[#303380]">Converting speech to text...</span>
                </>
              )}
            </div>
            {(status === "preparing" || status === "reading" || status === "recording") && (
              <div className="text-2xl font-bold text-[#303380]">{formatTime(displaySeconds)}</div>
            )}
          </div>
          {status === "recording" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${recordingBarPercent}%`,
                      backgroundColor: recordingBarColor ?? "#ef4444",
                    }}
                  />
                </div>
              </div>
              {onSkipToNext && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      stopRecording();
                      onSkipToNext();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#303380] rounded-lg hover:bg-[#252760] transition-colors"
                  >
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Initial state - automatically starts, show loading
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        {formatSpeakingPrompt(question.prompt?.text || "Speaking question")}
      </div>

      <div className="rounded-lg border border-[#303380] bg-[#303380]/5 px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-[#303380] animate-pulse" />
          <span className="text-sm font-medium text-[#303380]">Starting recording...</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 mb-2">{error}</p>
              <button
                onClick={handleStart}
                className="text-sm font-medium text-red-700 underline hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
