"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Clock, AlertCircle } from "lucide-react";

interface QSpeakingRecordingProps {
  question: {
    id: string;
    prompt: {
      text: string;
      part?: number; // 1, 2, or 3 (optional, can be overridden by speakingPart prop)
    };
  };
  value?: { audioUrl?: string; isRecording?: boolean };
  onChange?: (value: { audioUrl?: string; isRecording?: boolean }) => void;
  readOnly?: boolean;
  attemptId?: string;
  speakingPart?: number; // Override part number (for new separate sections)
  onRecordingComplete?: () => void; // Callback when recording is uploaded
  autoStart?: boolean; // Auto-start the recording process
}

// Timer durations based on part (IELTS standard)
const RECORDING_DURATIONS = {
  1: 30,   // Part 1: 30 seconds per question
  2: 120,  // Part 2: 2 minutes (with 1 minute preparation)
  3: 60,   // Part 3: 60 seconds per question
};

const PREPARATION_DURATION = 60; // Part 2 only: 1 minute prep time

export function QSpeakingRecording({
  question,
  value = {},
  onChange,
  readOnly = false,
  attemptId,
  speakingPart,
  onRecordingComplete,
  autoStart = false,
}: QSpeakingRecordingProps) {
  const part = speakingPart || question.prompt.part || 1;
  const recordingDuration = RECORDING_DURATIONS[part as keyof typeof RECORDING_DURATIONS] || 30;
  const hasPreparation = part === 2;

  const [status, setStatus] = useState<"idle" | "preparing" | "reading" | "recording" | "uploading" | "completed">("idle");
  const [timeLeft, setTimeLeft] = useState(hasPreparation ? PREPARATION_DURATION : recordingDuration);
  const [error, setError] = useState<string | null>(null);

  // Check if page is secure (HTTPS or localhost)
  const isSecureContext = typeof window !== "undefined" && (
    window.location.protocol === "https:" || 
    window.location.hostname === "localhost" || 
    window.location.hostname === "127.0.0.1"
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startPreparation = async () => {
    setStatus("preparing");
    setTimeLeft(PREPARATION_DURATION);
    setError(null);

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // After preparation, start reading phase
          setTimeout(() => startReading(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startReading = () => {
    setStatus("reading");
    setTimeLeft(3); // 3 seconds reading time
    setError(null);

    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-start recording after reading
          setTimeout(() => startRecording(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine the best MIME type
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
        // Upload the recording
        await uploadRecording();
      };

      mediaRecorder.start();
      setStatus("recording");
      setTimeLeft(recordingDuration);

      // Notify parent component that recording has started
      if (onChange) {
        onChange({ ...value, isRecording: true });
      }

      // Start recording countdown
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      
      // Provide specific error messages based on error type
      let errorMessage = "Microphone access denied. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please allow microphone access in your browser settings and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No microphone found. Please connect a microphone and try again.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage += "Microphone is being used by another application. Please close other applications and try again.";
      } else if (err.name === "NotSupportedError" || err.message?.includes("secure context")) {
        errorMessage += "Microphone access requires a secure connection (HTTPS). Please access this page via HTTPS or localhost.";
      } else if (err.message?.includes("getUserMedia is not defined")) {
        errorMessage += "Your browser does not support microphone access. Please use a modern browser (Chrome, Firefox, Edge, Safari).";
      } else {
        errorMessage += "Please check your browser settings and try again.";
      }
      
      setError(errorMessage);
      setStatus("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadRecording = async () => {
    setStatus("uploading");

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      
      // Create FormData
      const formData = new FormData();
      formData.append("file", audioBlob, `speaking-${question.id}.webm`);
      formData.append("questionId", question.id);

      // Upload to backend
      const response = await fetch(`/api/attempts/${attemptId}/speaking/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();

      // Save URL as answer
      if (onChange) {
        onChange({ audioUrl: data.url, isRecording: false });
      }

      setStatus("completed");
      
      // Call callback if provided
      if (onRecordingComplete) {
        onRecordingComplete();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setStatus("idle");
    }
  };

  const handleStart = () => {
    if (hasPreparation) {
      startPreparation();
    } else {
      // For Part 1 and 3, start with reading phase
      startReading();
    }
  };

  // Auto-start when autoStart is true and status is idle
  useEffect(() => {
    if (autoStart && status === "idle" && !value.audioUrl && !readOnly) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        handleStart();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]); // Only run once on mount

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If already completed (has audio URL) and read-only
  if (readOnly && value.audioUrl) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
          <p className="text-sm text-gray-600 mb-3">Your recorded answer:</p>
          <audio controls src={value.audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    );
  }

  // Show only the question text (voice recorder and HTTPS messages commented out)
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <p className="text-sm text-gray-800 whitespace-pre-line">{question.prompt?.text || "Speaking question"}</p>
      </div>
    </div>
  );

  /* COMMENTED OUT: Voice recorder UI and Secure Connection / Microphone HTTPS texts
  // If completed (has audio URL)
  if (status === "completed" && value.audioUrl) {
    return (
      <div className="space-y-3">
        ...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isSecureContext && (
        <div ...>
          Secure Connection Required
          Microphone access requires HTTPS. Please access this page via HTTPS or use localhost for development.
        </div>
      )}
      ... error, timer, recording indicator, start button ...
    </div>
  );
  */
}


