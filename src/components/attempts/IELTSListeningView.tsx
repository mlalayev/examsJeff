"use client";

import React, { useState, useEffect, useMemo } from "react";
import { IELTSAudioPlayer } from "@/components/audio/IELTSAudioPlayer";
import { Clock, CheckCircle2 } from "lucide-react";

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
      questions.filter((q) => q.order >= 1 && q.order <= 10), // Part 1: Q1-10
      questions.filter((q) => q.order >= 11 && q.order <= 20), // Part 2: Q11-20
      questions.filter((q) => q.order >= 21 && q.order <= 30), // Part 3: Q21-30
      questions.filter((q) => q.order >= 31 && q.order <= 40), // Part 4: Q31-40
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

  const audioSource = section.audio || section.questions?.[0]?.prompt?.audio;

  return (
    <div className="space-y-6">
      {/* Audio Player */}
      {audioSource ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              🎧 Listening Audio
            </h3>
            <p className="text-sm text-gray-600">
              Listen to the audio and answer the questions below
            </p>
          </div>
          <IELTSAudioPlayer src={audioSource} className="w-full" />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              🎧 Listening Audio
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Audio file will be available during the actual exam
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 text-center">
              ⚠️ Audio file not available. Please contact your teacher.
            </p>
          </div>
        </div>
      )}

      {/* Timer and Part Selection - Fixed Top Right */}
      <div 
        className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg shadow-lg p-2"
        style={{
          backgroundColor: "#D8D8E0",
          borderColor: "rgba(48, 51, 128, 0.1)",
          border: "1px solid",
        }}
      >
        {/* Part Selection - Small Squares */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((partNum) => {
            const progress = partProgress[partNum - 1];
            const isActive = currentPart === partNum;
            return (
              <button
                key={partNum}
                onClick={() => onPartChange?.(partNum)}
                className="relative w-16 h-16 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center"
                style={isActive ? {
                  backgroundColor: "#303380",
                  borderColor: "#303380",
                  color: "white",
                  boxShadow: "0 4px 6px rgba(48, 51, 128, 0.3)",
                } : {
                  backgroundColor: "white",
                  borderColor: "rgba(48, 51, 128, 0.15)",
                  color: "rgba(48, 51, 128, 0.9)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(48, 51, 128, 0.3)";
                    e.currentTarget.style.backgroundColor = "rgba(48, 51, 128, 0.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "rgba(48, 51, 128, 0.15)";
                    e.currentTarget.style.backgroundColor = "white";
                  }
                }}
                title={`Part ${partNum}: ${progress.answered}/${progress.total}`}
              >
                <div 
                  className="text-xs font-bold mb-1"
                  style={{ color: isActive ? "white" : "rgba(48, 51, 128, 0.9)" }}
                >
                  P{partNum}
                </div>
                {/* Mini Progress Bar */}
                <div 
                  className="w-10 rounded-full h-1 overflow-hidden"
                  style={{ 
                    backgroundColor: isActive 
                      ? "rgba(255, 255, 255, 0.3)" 
                      : "rgba(48, 51, 128, 0.1)" 
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${progress.percentage}%`,
                      backgroundColor: isActive 
                        ? "white" 
                        : progress.percentage === 100 
                          ? "#10b981" 
                          : "#303380"
                    }}
                  />
                  </div>
                <div 
                  className="text-[10px] font-semibold mt-0.5"
                  style={{ 
                    color: isActive 
                      ? "white" 
                      : "rgba(48, 51, 128, 0.7)" 
                  }}
                >
                  {progress.answered}/{progress.total}
                  </div>
                {progress.percentage === 100 && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle2 
                      className="w-3 h-3" 
                      style={{ 
                        color: isActive 
                          ? "rgba(255, 255, 255, 0.8)" 
                          : "#10b981" 
                      }}
                    />
                </div>
                )}
              </button>
            );
          })}
      </div>

        {/* Timer */}
        <div 
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2"
          style={isExpired ? {
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderColor: "rgba(239, 68, 68, 0.3)",
          } : {
            backgroundColor: "white",
            borderColor: "rgba(48, 51, 128, 0.15)",
          }}
        >
          <Clock 
            className="w-4 h-4" 
            style={{ color: getTimeColor() === "text-red-600" ? "#dc2626" : getTimeColor() === "text-orange-600" ? "#ea580c" : "rgba(48, 51, 128, 0.7)" }}
          />
          <span 
            className="text-lg font-bold tabular-nums"
                        style={{
              color: getTimeColor() === "text-red-600" ? "#dc2626" : getTimeColor() === "text-orange-600" ? "#ea580c" : "rgba(48, 51, 128, 0.9)" 
            }}
          >
            {formatTime(timeRemaining)}
          </span>
                    </div>
                  </div>
                </div>
              );
}

