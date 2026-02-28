"use client";

import React, { useState, useEffect, useMemo } from "react";
import { IELTSAudioPlayer } from "@/components/audio/IELTSAudioPlayer";
import { IELTSPartsTimerBar } from "@/components/attempts/IELTSPartsTimerBar";
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

interface IELTSListeningViewProps {
  section: Section;
  answers: Record<string, any>;
  onPartChange?: (part: number) => void;
  currentPart?: number;
  onTimeExpired?: () => void;
  attemptId?: string; // For localStorage
}

export function IELTSListeningView({
  section,
  answers,
  onPartChange,
  currentPart = 1,
  onTimeExpired,
  attemptId,
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

  // Split questions into 4 parts (10 questions each)
  const parts = useMemo(() => {
    const questions = section.questions || [];
    return [
      questions.filter((q) => q.order >= 0 && q.order <= 9), // Part 1: Q1-10 (order 0-9)
      questions.filter((q) => q.order >= 10 && q.order <= 19), // Part 2: Q11-20 (order 10-19)
      questions.filter((q) => q.order >= 20 && q.order <= 29), // Part 3: Q21-30 (order 20-29)
      questions.filter((q) => q.order >= 30 && q.order <= 39), // Part 4: Q31-40 (order 30-39)
    ];
  }, [section.questions]);

  // Calculate progress for each part
  const partProgress = useMemo(() => {
    return parts.map((partQuestions) => {
      const answered = partQuestions.filter((q) => {
        const answer = answers[q.id];
        return answer !== undefined && answer !== null && answer !== "";
      }).length;
      return {
        answered,
        total: partQuestions.length,
        percentage: partQuestions.length > 0 ? (answered / partQuestions.length) * 100 : 0,
      };
    });
  }, [parts, answers]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalQuestions = section.questions?.length || 0;
    const answeredQuestions = section.questions?.filter((q) => {
      const answer = answers[q.id];
      return answer !== undefined && answer !== null && answer !== "";
    }).length || 0;
    return {
      answered: answeredQuestions,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    };
  }, [section.questions, answers]);

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

      {/* Timer and Part Selection - Fixed Top Right */}
      <IELTSPartsTimerBar
        partCount={4}
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

