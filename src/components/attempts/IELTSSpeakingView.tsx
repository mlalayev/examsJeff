"use client";

import React, { useState, useEffect, useMemo } from "react";
import { IELTSPartsTimerBar } from "@/components/attempts/IELTSPartsTimerBar";

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

interface IELTSSpeakingViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
}

export function IELTSSpeakingView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
}: IELTSSpeakingViewProps) {
  // Get localStorage key for timer
  const getTimerStorageKey = () => {
    if (!attemptId || !section.id) return null;
    return `ielts_speaking_timer_${attemptId}_${section.id}`;
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

  // Split questions into 3 parts based on prompt.part or order
  const parts = useMemo(() => {
    const questions = section.questions || [];
    
    // Try to group by prompt.part first, then fall back to order-based grouping
    const part1Questions: Question[] = [];
    const part2Questions: Question[] = [];
    const part3Questions: Question[] = [];
    
    questions.forEach((q) => {
      const part = q.prompt?.part;
      if (part === 1) {
        part1Questions.push(q);
      } else if (part === 2) {
        part2Questions.push(q);
      } else if (part === 3) {
        part3Questions.push(q);
      } else {
        // Fall back to order-based grouping if no part specified
        // Assume roughly equal distribution or check prompt text for "Part 1", "Part 2", "Part 3"
        const promptText = q.prompt?.text?.toLowerCase() || "";
        if (promptText.includes("part 1") || promptText.includes("part1")) {
          part1Questions.push(q);
        } else if (promptText.includes("part 2") || promptText.includes("part2")) {
          part2Questions.push(q);
        } else if (promptText.includes("part 3") || promptText.includes("part3")) {
          part3Questions.push(q);
        } else {
          // Default: distribute by order (roughly equal)
          if (q.order < questions.length / 3) {
            part1Questions.push(q);
          } else if (q.order < (questions.length * 2) / 3) {
            part2Questions.push(q);
          } else {
            part3Questions.push(q);
          }
        }
      }
    });
    
    return [part1Questions, part2Questions, part3Questions];
  }, [section.questions]);

  // Calculate progress for each part
  const partProgress = useMemo(() => {
    return parts.map((partQuestions) => {
      const answered = partQuestions.filter((q) => {
        const answer = answers[q.id];
        // For speaking, check if there's an audio URL or text answer
        if (typeof answer === "object" && answer !== null) {
          return answer.audioUrl !== undefined && answer.audioUrl !== null && answer.audioUrl !== "";
        }
        return answer !== undefined && answer !== null && answer !== "";
      }).length;
      return {
        answered,
        total: partQuestions.length,
        percentage: partQuestions.length > 0 ? (answered / partQuestions.length) * 100 : 0,
      };
    });
  }, [parts, answers]);

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
        partCount={3}
        partLabel="P"
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

