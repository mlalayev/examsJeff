"use client";

import React, { useState, useEffect } from "react";

interface Question {
  id: string;
  order: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  durationMin: number;
}

export interface ReadingTimerState {
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (seconds: number) => string;
  getTimeColor: () => string;
}

interface IELTSReadingViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
  onTimerStateChange?: (state: ReadingTimerState | null) => void; // For sidebar display
}

export function IELTSReadingView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
  onTimerStateChange,
}: IELTSReadingViewProps) {
  // Get localStorage key for timer
  const getTimerStorageKey = () => {
    if (!attemptId || !section.id) return null;
    return `ielts_reading_timer_${attemptId}_${section.id}`;
  };

  // Initialize timer from localStorage or default
  const initializeTimer = () => {
    if (typeof window === "undefined") return section.durationMin * 60;
    
    const storageKey = getTimerStorageKey();
    if (!storageKey) return section.durationMin * 60;

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
    const endTime = startTime + section.durationMin * 60 * 1000;
    localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
    return section.durationMin * 60;
  };

  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (typeof window === "undefined") return section.durationMin * 60;
    return initializeTimer();
  });
  const [isExpired, setIsExpired] = useState(timeRemaining === 0);

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
          // Timer expired
          setTimeRemaining(0);
          setIsExpired(true);
          localStorage.removeItem(storageKey);
          if (onTimeExpired) {
            onTimeExpired();
          }
        }
      } catch (e) {
        console.error("Failed to parse saved timer:", e);
        localStorage.removeItem(storageKey);
      }
    } else {
      // No saved timer, start fresh
      const startTime = Date.now();
      const endTime = startTime + section.durationMin * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
      setTimeRemaining(section.durationMin * 60);
      setIsExpired(false);
    }
  }, [attemptId, section.id, section.durationMin, onTimeExpired]);

  // Timer effect - countdown and save to localStorage
  useEffect(() => {
    if (isExpired) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          // Clear timer from localStorage when expired
          const storageKey = getTimerStorageKey();
          if (storageKey && typeof window !== "undefined") {
            localStorage.removeItem(storageKey);
          }
          if (onTimeExpired) {
            onTimeExpired();
          }
          return 0;
        }
        
        // Update localStorage with remaining time
        const storageKey = getTimerStorageKey();
        if (storageKey && typeof window !== "undefined") {
          const now = Date.now();
          const endTime = now + (prev - 1) * 1000;
          const startTime = endTime - section.durationMin * 60 * 1000;
          localStorage.setItem(storageKey, JSON.stringify({ startTime, endTime }));
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExpired, onTimeExpired, section.durationMin, attemptId, section.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (isExpired) return "text-red-600";
    if (timeRemaining < 300) return "text-orange-600"; // Less than 5 minutes
    return "text-gray-700";
  };

  // Report timer state to parent for sidebar display
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
      {/* Timer and passage part choosers are shown in the sidebar for IELTS Reading */}
    </div>
  );
}

