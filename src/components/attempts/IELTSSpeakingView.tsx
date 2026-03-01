"use client";

import React, { useState, useEffect, useRef } from "react";

interface Question {
  id: string;
  order: number;
  prompt?: {
    part?: number;
    text?: string;
  };
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  durationMin: number;
}

// All IELTS sections use 2 minutes
const SPEAKING_DURATION_MIN = 2;

export type IELTSSpeakingTimerState = {
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (s: number) => string;
  getTimeColor: () => string;
};

interface IELTSSpeakingViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
  onTimerStateChange?: (state: IELTSSpeakingTimerState | null) => void; // For sidebar
}

export function IELTSSpeakingView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
  onTimerStateChange,
}: IELTSSpeakingViewProps) {
  const durationMin = SPEAKING_DURATION_MIN;

  // Get localStorage key for timer
  const getTimerStorageKey = () => {
    if (!attemptId || !section.id) return null;
    return `ielts_speaking_timer_${attemptId}_${section.id}`;
  };

  // Initialize timer from localStorage or default (20 min)
  const initializeTimer = () => {
    if (typeof window === "undefined") return durationMin * 60;

    const storageKey = getTimerStorageKey();
    if (!storageKey) return durationMin * 60;

    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      try {
        const { endTime } = JSON.parse(savedTimer);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        if (remaining > 0) {
          return remaining;
        } else {
          localStorage.removeItem(storageKey);
          return 0;
        }
      } catch (e) {
        console.error("Failed to parse saved timer:", e);
        localStorage.removeItem(storageKey);
      }
    }

    const startTime = Date.now();
    const endTime = startTime + durationMin * 60 * 1000;
    localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
    return durationMin * 60;
  };

  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (typeof window === "undefined") return durationMin * 60;
    return initializeTimer();
  });
  const [isExpired, setIsExpired] = useState(timeRemaining === 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize timer from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getTimerStorageKey();
    if (!storageKey) return;

    const savedTimer = localStorage.getItem(storageKey);
    if (savedTimer) {
      try {
        const { endTime } = JSON.parse(savedTimer);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        if (remaining > 0) {
          setTimeRemaining(remaining);
          setIsExpired(false);
        } else {
          setTimeRemaining(0);
          setIsExpired(true);
          localStorage.removeItem(storageKey);
          if (onTimeExpired) onTimeExpired();
        }
      } catch (e) {
        console.error("Failed to parse saved timer:", e);
        localStorage.removeItem(storageKey);
      }
    } else {
      const startTime = Date.now();
      const endTime = startTime + durationMin * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
      setTimeRemaining(durationMin * 60);
      setIsExpired(false);
    }
  }, [attemptId, section.id, onTimeExpired]);

  // Countdown: read from localStorage endTime each tick so only one source of truth (fixes double-tick)
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
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsExpired(true);
          localStorage.removeItem(storageKey);
          if (onTimeExpired) onTimeExpired();
        }
      } catch (_) {}
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isExpired, onTimeExpired, attemptId, section.id]);

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

  return (
    <div className="space-y-6">
      {/* Timer and part choosers are shown in the sidebar */}
    </div>
  );
}

