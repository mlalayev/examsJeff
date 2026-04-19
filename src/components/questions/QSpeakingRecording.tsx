"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Clock, AlertCircle, Loader2 } from "lucide-react";
import { speakSecondsForSpeakingPart } from "@/lib/ielts-speaking-timers";

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
  /** Fired when the mic capture has finished (before transcription). Enables “Next” early on IELTS run. */
  onRecordingStopped?: () => void;
  /** IELTS exam run: do not show transcribed text; softer “saving” copy instead of “speech to text”. */
  ieltsExamSpeakingMinimalUi?: boolean;
  autoStart?: boolean;
  /** When set (IELTS attempt run page), one shared countdown: prep/think + speaking */
  questionSecondsLeft?: number;
}

// Recording segment only (prep is driven by parent countdown when `questionSecondsLeft` is set)
const RECORDING_DURATIONS = {
  1: 50,
  2: 120,
  3: 80,
};

const PREPARATION_DURATION = 60; // Part 2 internal prep when not using parent timer

export function QSpeakingRecording({
  question,
  value = "",
  onChange,
  readOnly = false,
  attemptId,
  speakingPart,
  onRecordingComplete,
  onRecordingStopped,
  ieltsExamSpeakingMinimalUi = false,
  autoStart = false,
  questionSecondsLeft,
}: QSpeakingRecordingProps) {
  const part = speakingPart || question.prompt.part || 1;
  const recordingDuration = RECORDING_DURATIONS[part as keyof typeof RECORDING_DURATIONS] || 30;
  const hasPreparation = part === 2;
  const useParentTimer = typeof questionSecondsLeft === "number";
  const speakCap = speakSecondsForSpeakingPart(part);
  const parentRecordingStartRef = useRef(false);

  const [status, setStatus] = useState<"idle" | "preparing" | "reading" | "recording" | "transcribing" | "completed">("idle");
  const [timeLeft, setTimeLeft] = useState(hasPreparation ? PREPARATION_DURATION : recordingDuration);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef<boolean>(false); // Prevent double-start in StrictMode
  const permissionRequestedRef = useRef<boolean>(false);
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

  // Check existing microphone permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (typeof navigator === 'undefined' || !navigator.permissions) {
        setIsCheckingPermission(false);
        return;
      }

      try {
        // Check if permission API is available
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setPermissionGranted(true);
          setError(null);
          permissionRequestedRef.current = true;
        } else if (permissionStatus.state === 'denied') {
          setError("Microphone access denied. Please allow microphone access in your browser settings and refresh the page.");
          setPermissionGranted(false);
        }
        
        // Listen for permission changes
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            setPermissionGranted(true);
            setError(null);
            permissionRequestedRef.current = true;
          } else if (permissionStatus.state === 'denied') {
            setError("Microphone access denied. Please allow microphone access in your browser settings and refresh the page.");
            setPermissionGranted(false);
          }
        };
      } catch (err) {
        // Permission API not supported or failed, try getUserMedia
        console.log("Permission API not available, will request via getUserMedia");
      }
      
      setIsCheckingPermission(false);
    };

    if (!readOnly && !value) {
      checkPermission();
    } else {
      setIsCheckingPermission(false);
    }
  }, [readOnly, value]);

  // Request microphone permission early
  const requestMicrophonePermission = async () => {
    if (permissionRequestedRef.current && permissionGranted) {
      // Already have permission
      return true;
    }
    
    permissionRequestedRef.current = true;

    try {
      // Request permission and immediately release the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      setError(null); // Clear any previous errors
      
      // Release the stream immediately - we'll request it again when recording
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      
      let errorMessage = "Microphone access denied. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow microphone access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone and refresh the page.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Microphone is being used by another application. Please close other apps and refresh.";
      } else {
        errorMessage += "Please check your browser settings and refresh the page.";
      }
      
      setError(errorMessage);
      setPermissionGranted(false);
      return false;
    }
  };

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
    if (useParentTimer) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearPhaseTimeout();

    setStatus("reading");
    timeLeftRef.current = 3;
    setTimeLeft(3);
    setError(null);

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

      // Request fresh stream for recording
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
        onRecordingStopped?.();
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
      console.error("Recording start error:", err);
      
      let errorMessage = "Failed to start recording. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow microphone access in your browser settings and refresh the page.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone and refresh the page.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Microphone is being used by another application. Please close other apps and try again.";
      } else {
        errorMessage += err.message || "Please check your microphone and try again.";
      }
      
      setError(errorMessage);
      setStatus("idle");
      hasStartedRef.current = false;
      permissionRequestedRef.current = false;
      if (useParentTimer) parentRecordingStartRef.current = false;
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

  useEffect(() => {
    if (!useParentTimer) return;
    if (!hasStartedRef.current) return;
    if (status === "transcribing" || status === "completed") return;
    const left = questionSecondsLeft ?? 0;
    if (left > speakCap) {
      parentRecordingStartRef.current = false;
      return;
    }
    if (left <= 0) return;
    if (parentRecordingStartRef.current) return;
    parentRecordingStartRef.current = true;
    void startRecording();
    // startRecording is recreated each render; we only react to timer / status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSecondsLeft, useParentTimer, speakCap, status]);

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

      console.log("🎤 Transcription completed:", {
        questionId: question.id,
        transcribedText: data.text,
        textLength: data.text?.length || 0
      });

      if (onChange) {
        onChange(data.text || "");
        console.log("🎤 onChange callback called with transcribed text");
      }

      setStatus("completed");
      
      if (onRecordingComplete) {
        onRecordingComplete();
        console.log("🎤 onRecordingComplete callback called");
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(`Transcription failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("idle");
      if (useParentTimer) parentRecordingStartRef.current = false;
    }
  };

  const handleStart = async () => {
    if (hasStartedRef.current) return;

    // If we already have permission, skip the request
    if (!permissionGranted) {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        return; // Error is already set by requestMicrophonePermission
      }
    }

    hasStartedRef.current = true;

    if (useParentTimer) {
      setStatus("preparing");
      setError(null);
      return;
    }

    if (hasPreparation) {
      startPreparation();
    } else {
      startReading();
    }
  };

  // Request permission immediately on mount (non-blocking) - only if not already checked
  useEffect(() => {
    if (!readOnly && !value && !isCheckingPermission && !permissionGranted) {
      requestMicrophonePermission();
    }
  }, [isCheckingPermission]); // Run after permission check completes

  useEffect(() => {
    // Auto-start recording flow after permission is granted
    if (status === "idle" && !value && !readOnly && !hasStartedRef.current && permissionGranted) {
      const timer = setTimeout(() => {
        void handleStart();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionGranted, status, value, readOnly]); // Trigger when permission is granted

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSpeakingPrompt = (text: string): React.ReactNode => {
    if (!text || typeof text !== "string") {
      return <p className="text-sm text-gray-500">Speaking question</p>;
    }
    const trimmed = text.replace(/\\n/g, "\n").trim();

    if (/^\*\*/.test(trimmed)) {
      const titleMatch = trimmed.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
      if (titleMatch) {
        const title = titleMatch[1].trim();
        let tail = titleMatch[2].trim();
        const nodes: React.ReactNode[] = [
          <p key="title" className="text-base font-bold text-gray-900 leading-snug">
            {title}
          </p>,
        ];

        const grayPair = /^\[gray\]([\s\S]*?)\[gray\]/i;
        let gp = tail.match(grayPair);
        while (gp) {
          nodes.push(
            <p key={`g-${nodes.length}`} className="text-sm text-gray-500 leading-relaxed">
              {gp[1].trim()}
            </p>
          );
          tail = tail.slice(gp[0].length).trim();
          gp = tail.match(grayPair);
        }

        const grayClose = tail.match(/^\[gray\]([\s\S]*?)\[\/gray\]/i);
        if (grayClose) {
          nodes.push(
            <p key={`gc-${nodes.length}`} className="text-sm text-gray-500 leading-relaxed">
              {grayClose[1].trim()}
            </p>
          );
          tail = tail.slice(grayClose[0].length).trim();
        }

        const lines = tail
          .split(/\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          nodes.push(
            <ul
              key="bullets"
              className="list-disc space-y-1.5 pl-5 text-sm text-gray-800"
            >
              {lines.map((line, i) => (
                <li key={i} className="pl-0.5">
                  {line.replace(/^[-•\u2022]\s*/, "")}
                </li>
              ))}
            </ul>
          );
        }

        return <div className="space-y-3">{nodes}</div>;
      }
    }

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

  // If completed with text answer - show question + answer (or minimal confirmation for IELTS exam)
  if (value && value.trim()) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          {formatSpeakingPrompt(question.prompt?.text || "Speaking question")}
        </div>
        {ieltsExamSpeakingMinimalUi ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3">
            <p className="text-sm font-medium text-emerald-900">Your response has been saved.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Your Answer (Transcribed):</p>
            <p className="text-sm text-gray-800 whitespace-pre-line">{value}</p>
          </div>
        )}
      </div>
    );
  }

  if (status !== "idle") {
    if (useParentTimer) {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
            {formatSpeakingPrompt(question.prompt?.text || "Speaking question")}
          </div>

          <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              {status === "preparing" && (
                <>
                  <Clock className="w-4 h-4 shrink-0 text-slate-600 mt-0.5" />
                  <span className="text-sm text-slate-700 leading-snug">
                    {part === 1
                      ? "Thinking time — when the bar below reaches the dot, your microphone will turn on."
                      : "Preparation time — you may take notes. Recording starts at the dot on the bar below."}
                  </span>
                </>
              )}
              {status === "recording" && (
                <>
                  <Mic className="w-4 h-4 shrink-0 text-red-600 animate-pulse mt-0.5" />
                  <span className="text-sm font-medium text-red-800 leading-snug">
                    Recording — speak clearly. The timer below shows time remaining for this question.
                  </span>
                </>
              )}
              {status === "transcribing" && (
                <>
                  <Loader2 className="w-4 h-4 shrink-0 text-[#303380] animate-spin mt-0.5" />
                  <span className="text-sm font-medium text-[#303380]">
                    {ieltsExamSpeakingMinimalUi ? "Saving your response…" : "Converting speech to text…"}
                  </span>
                </>
              )}
              {status === "reading" && (
                <>
                  <Clock className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <span className="text-sm text-blue-800">Get ready…</span>
                </>
              )}
            </div>
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

    const displaySeconds = timeLeft;
    const recordingBarPercent = Math.max(
      0,
      Math.min(100, ((recordingDuration - timeLeft) / recordingDuration) * 100)
    );

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
                  <span className="text-sm font-medium text-[#303380]">
                    {ieltsExamSpeakingMinimalUi ? "Saving your response…" : "Converting speech to text..."}
                  </span>
                </>
              )}
            </div>
            {(status === "preparing" || status === "reading" || status === "recording") && (
              <div className="text-2xl font-bold text-[#303380]">{formatTime(displaySeconds)}</div>
            )}
          </div>
          {status === "recording" && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-linear bg-red-500"
                  style={{ width: `${recordingBarPercent}%` }}
                />
              </div>
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

      {!error && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-slate-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-600">
              {isCheckingPermission 
                ? "Checking microphone access..." 
                : useParentTimer 
                  ? "Loading — use the timer below when it appears." 
                  : "Starting recording…"
              }
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 mb-2">{error}</p>
              <button
                onClick={async () => {
                  // Reset state
                  hasStartedRef.current = false;
                  permissionRequestedRef.current = false;
                  setError(null);
                  setStatus("idle");
                  setPermissionGranted(false);
                  setIsCheckingPermission(false);
                  // Try again
                  await handleStart();
                }}
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
