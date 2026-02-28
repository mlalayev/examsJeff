"use client";

import React, { useState, useEffect, useMemo } from "react";
import { IELTSPartsTimerBar } from "@/components/attempts/IELTSPartsTimerBar";

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

interface IELTSWritingViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
  allSections?: Section[]; // All sections to find Task 1 and Task 2
}

export function IELTSWritingView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
  allSections = [],
}: IELTSWritingViewProps) {
  // Get localStorage key for timer
  const getTimerStorageKey = () => {
    if (!attemptId || !section.id) return null;
    return `ielts_writing_timer_${attemptId}_${section.id}`;
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

  // Find Task 1 and Task 2 sections
  const writingSections = useMemo(() => {
    const task1 = allSections.find(s => s.type === "WRITING" && (s.title.includes("Task 1") || s.title.includes("task 1")));
    const task2 = allSections.find(s => s.type === "WRITING" && (s.title.includes("Task 2") || s.title.includes("task 2")));
    return [task1, task2].filter(Boolean) as Section[];
  }, [allSections]);

  // Calculate progress for each task
  const partProgress = useMemo(() => {
    return writingSections.map((taskSection) => {
      if (!taskSection) return { answered: 0, total: 0, percentage: 0 };
      
      const hasAnswer = (() => {
        const answer = answers[taskSection.id];
        if (typeof answer === "object" && answer !== null) {
          // Check for writing_text field
          return answer.writing_text !== undefined && answer.writing_text !== null && answer.writing_text !== "";
        }
        return answer !== undefined && answer !== null && answer !== "";
      })();
      
      return {
        answered: hasAnswer ? 1 : 0,
        total: 1,
        percentage: hasAnswer ? 100 : 0,
      };
    });
  }, [writingSections, answers]);

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

  return (
    <div className="space-y-6">
      <IELTSPartsTimerBar
        partCount={2}
        partLabel="T"
        partProgress={partProgress}
        currentPart={currentPart}
        onPartChange={onPartChange}
        timeRemaining={timeRemaining}
        isExpired={isExpired}
        formatTime={formatTime}
        getTimeColor={getTimeColor}
      />
    </div>
  );
}

