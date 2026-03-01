"use client";

import React, { useState, useEffect, useRef } from "react";
import { IELTSAudioPlayer } from "@/components/audio/IELTSAudioPlayer";
import { Headphones } from "lucide-react";

interface Question {
  id: string;
  order: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  audio?: string | null;
  durationMin: number;
}

// All IELTS sections use 2 minutes
const IELTS_DURATION_MIN = 2;

export type IELTSTimerState = {
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (s: number) => string;
  getTimeColor: () => string;
};

interface IELTSListeningViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
  onTimerStateChange?: (state: IELTSTimerState | null) => void; // For sidebar
}

export function IELTSListeningView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
  onTimerStateChange,
}: IELTSListeningViewProps) {
  // Get localStorage key for timer
  const getTimerStorageKey = () => {
    if (!attemptId || !section.id) return null;
    return `ielts_listening_timer_${attemptId}_${section.id}`;
  };

  // Initialize timer from localStorage or default
  const initializeTimer = () => {
    if (typeof window === "undefined") return section.durationMin * 60;
    
    const storageKey = getTimerStorageKey();
    if (!storageKey) return IELTS_DURATION_MIN * 60;

    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      try {
        const { endTime } = JSON.parse(savedTimer);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        if (remaining > 0) {
          return remaining;
        } else {
          // Timer expired, remove from localStorage
          localStorage.removeItem(storageKey);
          return 0;
        }
      } catch (e) {
        console.error("Failed to parse saved timer:", e);
        localStorage.removeItem(storageKey);
      }
    }
    
    // No saved timer, start fresh
    const startTime = Date.now();
    const endTime = startTime + IELTS_DURATION_MIN * 60 * 1000;
    localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
    return IELTS_DURATION_MIN * 60;
  };

  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (typeof window === "undefined") return IELTS_DURATION_MIN * 60;
    return initializeTimer();
  });
  const [isExpired, setIsExpired] = useState(timeRemaining === 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeExpiredRef = useRef(onTimeExpired);
  onTimeExpiredRef.current = onTimeExpired;

  // Init: read from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = getTimerStorageKey();
    if (!storageKey) return;

    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      try {
        const { endTime } = JSON.parse(savedTimer);
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        if (remaining > 0) {
          setTimeRemaining(remaining);
          setIsExpired(false);
        } else {
          setTimeRemaining(0);
          setIsExpired(true);
          localStorage.removeItem(storageKey);
          onTimeExpiredRef.current?.();
        }
      } catch (e) {
        console.error("Failed to parse saved timer:", e);
        localStorage.removeItem(storageKey);
      }
    } else {
      const endTime = Date.now() + IELTS_DURATION_MIN * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ endTime }));
      setTimeRemaining(IELTS_DURATION_MIN * 60);
      setIsExpired(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, section.id]);

  // Countdown: read actual remaining time from localStorage each tick — immune to double-decrement
  useEffect(() => {
    if (isExpired) return;

    intervalRef.current = setInterval(() => {
      const storageKey = getTimerStorageKey();
      if (!storageKey || typeof window === "undefined") return;
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      try {
        const { endTime } = JSON.parse(saved);
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsExpired(true);
          localStorage.removeItem(storageKey);
          onTimeExpiredRef.current?.();
        }
      } catch (_) {}
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (isExpired) return "text-red-600";
    if (timeRemaining < 300) return "text-orange-600";
    return "text-gray-700";
  };

  useEffect(() => {
    onTimerStateChange?.({
      timeRemaining,
      isExpired,
      formatTime,
      getTimeColor,
    });
    return () => onTimerStateChange?.(null);
  }, [timeRemaining, isExpired, onTimerStateChange]);

  const audioSource = section.audio || (section.questions?.[0] as any)?.prompt?.audio;

  return (
    <div className="space-y-6">
      {/* Audio Player - simple card */}
      {audioSource ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Headphones className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Listening</h3>
              <p className="text-sm text-gray-500">Listen to the audio, then answer the questions below.</p>
            </div>
          </div>
          <IELTSAudioPlayer src={audioSource} className="w-full" />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Headphones className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Listening</h3>
              <p className="text-sm text-gray-500">Audio will be available during the exam.</p>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">Audio file not available. Please contact your teacher.</p>
          </div>
        </div>
      )}

      {/* Timer and part choosers are shown in the sidebar */}
    </div>
  );
}

