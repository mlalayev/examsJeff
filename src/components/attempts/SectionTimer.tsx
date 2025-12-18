"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface SectionTimerProps {
  sectionId: string;
  durationMinutes: number;
  onTimeExpired: () => void;
  isActive: boolean;
  startTime?: number; // Timestamp when timer started
  attemptId: string; // For localStorage key
}

const getLocalStorageKey = (attemptId: string, sectionId: string) => {
  return `sat_timer_${attemptId}_${sectionId}`;
};

export function SectionTimer({
  sectionId,
  durationMinutes,
  onTimeExpired,
  isActive,
  startTime,
  attemptId,
}: SectionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(durationMinutes * 60); // in seconds
  const [hasExpired, setHasExpired] = useState(false);

  // Load timer from localStorage on mount or when startTime changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const storageKey = getLocalStorageKey(attemptId, sectionId);
    
    // If startTime is provided, always use it (new timer)
    if (startTime) {
      // Clear any old timer
      localStorage.removeItem(storageKey);
      
      // Calculate remaining time
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeLeft(remaining);
      setHasExpired(false);
      
      // Save to localStorage
      const endTime = startTime + durationMinutes * 60 * 1000;
      localStorage.setItem(storageKey, JSON.stringify({ endTime, startTime }));
      
      if (remaining === 0) {
        setHasExpired(true);
        onTimeExpired();
      }
    } else {
      // No startTime, try to load from localStorage
      const savedTimer = localStorage.getItem(storageKey);
      
      if (savedTimer) {
        try {
          const { endTime } = JSON.parse(savedTimer);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          if (remaining > 0) {
            setTimeLeft(remaining);
            setHasExpired(false);
          } else {
            // Timer already expired
            setTimeLeft(0);
            setHasExpired(true);
            localStorage.removeItem(storageKey);
            onTimeExpired();
          }
        } catch (e) {
          console.error("Failed to parse saved timer:", e);
          localStorage.removeItem(storageKey);
        }
      } else {
        // No timer at all
        setTimeLeft(durationMinutes * 60);
        setHasExpired(false);
      }
    }
  }, [sectionId, attemptId, startTime, durationMinutes, onTimeExpired]); // React to startTime changes


  // Timer countdown - sync with localStorage
  useEffect(() => {
    if (!isActive || hasExpired || timeLeft <= 0) return;
    if (typeof window === "undefined") return;

    const storageKey = getLocalStorageKey(attemptId, sectionId);
    
    const interval = setInterval(() => {
      // Check localStorage for accurate time
      const savedTimer = localStorage.getItem(storageKey);
      if (savedTimer) {
        try {
          const { endTime } = JSON.parse(savedTimer);
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          
          if (remaining <= 0) {
            clearInterval(interval);
            localStorage.removeItem(storageKey);
            setTimeLeft(0);
            if (!hasExpired) {
              setHasExpired(true);
              onTimeExpired();
            }
            return;
          }
          
          setTimeLeft(remaining);
        } catch (e) {
          console.error("Failed to parse saved timer:", e);
        }
      } else {
        // Fallback to countdown
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            clearInterval(interval);
            if (!hasExpired) {
              setHasExpired(true);
              onTimeExpired();
            }
            return 0;
          }
          
          return newTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasExpired, onTimeExpired, timeLeft, sectionId, attemptId]);

  // Cleanup localStorage when timer expires or component unmounts
  useEffect(() => {
    return () => {
      if (hasExpired && typeof window !== "undefined") {
        const storageKey = getLocalStorageKey(attemptId, sectionId);
        localStorage.removeItem(storageKey);
      }
    };
  }, [hasExpired, sectionId, attemptId]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getTimerColor = () => {
    const percentLeft = (timeLeft / (durationMinutes * 60)) * 100;
    
    if (percentLeft <= 10) return "text-red-600 bg-red-50 border-red-200";
    if (percentLeft <= 25) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const isWarning = timeLeft <= durationMinutes * 60 * 0.1; // Last 10%

  if (!isActive) return null;

  return (
    <div className={`fixed top-4 right-4 z-40 px-4 py-3 rounded-lg border-2 shadow-lg ${getTimerColor()} transition-all duration-300`}>
      <div className="flex items-center gap-3">
        {isWarning ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
        <div>
          <div className="text-xs font-medium opacity-75 uppercase tracking-wide">
            Time Remaining
          </div>
          <div className={`text-2xl font-bold tabular-nums ${isWarning ? 'animate-pulse' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      {isWarning && timeLeft > 0 && (
        <div className="mt-2 text-xs font-medium">
          Hurry! Time is running out
        </div>
      )}
      
      {timeLeft === 0 && (
        <div className="mt-2 text-xs font-medium">
          Time's up! Auto-submitting...
        </div>
      )}
    </div>
  );
}

