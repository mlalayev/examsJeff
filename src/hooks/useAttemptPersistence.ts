"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Storage key format: ielts_attempt:{attemptId}:{moduleType}
 */
const getStorageKey = (attemptId: string, moduleType?: string) => {
  return `ielts_attempt:${attemptId}${moduleType ? `:${moduleType}` : ""}`;
};

/**
 * Data structure for persisted attempt state
 */
export interface PersistedAttemptState {
  attemptId: string;
  moduleType?: string;
  answers: Record<string, any>; // sectionId -> questionId -> answer
  activeSection?: string; // Current section ID
  currentQuestionIndex?: number;
  timerState?: {
    startedAt: number; // timestamp
    elapsed: number; // seconds
    remaining?: number; // seconds
  };
  audioState?: {
    currentTime: number; // seconds
    sectionId: string;
  };
  sectionStartTimes?: Record<string, number>; // sectionId -> timestamp
  lockedSections?: string[]; // Array of locked section IDs
  lastSaved: number; // timestamp
  version: string; // For version mismatch detection
}

/**
 * Hook options
 */
export interface UseAttemptPersistenceOptions {
  attemptId: string;
  moduleType?: string;
  answers: Record<string, any>;
  activeSection?: string;
  currentQuestionIndex?: number;
  timerStartedAt?: number;
  timerElapsed?: number;
  audioCurrentTime?: number;
  audioSectionId?: string;
  sectionStartTimes?: Record<string, number>;
  lockedSections?: Set<string>;
  isSubmitted?: boolean;
  onRestore?: (state: PersistedAttemptState) => void;
  debounceMs?: number;
}

const STORAGE_VERSION = "1.0.0";
const DEBOUNCE_MS = 300;

/**
 * Custom hook for persisting and restoring attempt state
 * 
 * Features:
 * - Auto-save to localStorage with debouncing
 * - Restore on mount
 * - Clear on submission
 * - Handle beforeunload
 * 
 * Usage:
 * ```tsx
 * const { saveNow, clearStorage, hasRestoredData } = useAttemptPersistence({
 *   attemptId,
 *   answers,
 *   activeSection,
 *   onRestore: (state) => {
 *     setAnswers(state.answers);
 *     setActiveSection(state.activeSection);
 *   }
 * });
 * ```
 */
export function useAttemptPersistence(options: UseAttemptPersistenceOptions) {
  const {
    attemptId,
    moduleType,
    answers,
    activeSection,
    currentQuestionIndex,
    timerStartedAt,
    timerElapsed,
    audioCurrentTime,
    audioSectionId,
    sectionStartTimes,
    lockedSections,
    isSubmitted = false,
    onRestore,
    debounceMs = DEBOUNCE_MS,
  } = options;

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);
  const storageKey = getStorageKey(attemptId, moduleType);

  /**
   * Save state to localStorage
   */
  const saveToStorage = useCallback(() => {
    if (isSubmitted) return; // Don't save if already submitted

    try {
      const state: PersistedAttemptState = {
        attemptId,
        moduleType,
        answers,
        activeSection,
        currentQuestionIndex,
        timerState: timerStartedAt !== undefined ? {
          startedAt: timerStartedAt,
          elapsed: timerElapsed || 0,
        } : undefined,
        audioState: audioCurrentTime !== undefined && audioSectionId ? {
          currentTime: audioCurrentTime,
          sectionId: audioSectionId,
        } : undefined,
        sectionStartTimes,
        lockedSections: lockedSections ? Array.from(lockedSections) : undefined,
        lastSaved: Date.now(),
        version: STORAGE_VERSION,
      };

      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }, [
    attemptId,
    moduleType,
    answers,
    activeSection,
    currentQuestionIndex,
    timerStartedAt,
    timerElapsed,
    audioCurrentTime,
    audioSectionId,
    sectionStartTimes,
    lockedSections,
    isSubmitted,
    storageKey,
  ]);

  /**
   * Debounced save
   */
  const saveDebounced = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveToStorage();
    }, debounceMs);
  }, [saveToStorage, debounceMs]);

  /**
   * Restore state from localStorage
   */
  const restoreFromStorage = useCallback((): PersistedAttemptState | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const state: PersistedAttemptState = JSON.parse(stored);

      // Version check
      if (state.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, clearing old data");
        localStorage.removeItem(storageKey);
        return null;
      }

      // Validate attemptId
      if (state.attemptId !== attemptId) {
        console.warn("Attempt ID mismatch, ignoring storage");
        return null;
      }

      // Check if data is not too old (e.g., 7 days)
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - state.lastSaved > MAX_AGE) {
        console.warn("Stored data is too old, clearing");
        localStorage.removeItem(storageKey);
        return null;
      }

      return state;
    } catch (error) {
      console.error("Failed to restore from localStorage:", error);
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey, attemptId]);

  /**
   * Clear storage
   */
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }, [storageKey]);

  /**
   * Restore on mount
   */
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restored = restoreFromStorage();
    if (restored && onRestore) {
      onRestore(restored);
    }
  }, [restoreFromStorage, onRestore]);

  /**
   * Auto-save on state changes (debounced)
   */
  useEffect(() => {
    if (!hasRestoredRef.current) return; // Wait for restore first
    saveDebounced();
  }, [
    answers,
    activeSection,
    currentQuestionIndex,
    timerElapsed,
    audioCurrentTime,
    sectionStartTimes,
    lockedSections,
    saveDebounced,
  ]);

  /**
   * Clear on submission
   */
  useEffect(() => {
    if (isSubmitted) {
      clearStorage();
    }
  }, [isSubmitted, clearStorage]);

  /**
   * Save on beforeunload
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToStorage();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveToStorage]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    saveNow: saveToStorage,
    clearStorage,
    hasRestoredData: hasRestoredRef.current,
  };
}

/**
 * Utility: Check if there's persisted data for an attempt
 */
export function hasPersistedAttempt(attemptId: string, moduleType?: string): boolean {
  try {
    const key = getStorageKey(attemptId, moduleType);
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Utility: Clear all persisted attempts (for cleanup)
 */
export function clearAllPersistedAttempts(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith("ielts_attempt:")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear all persisted attempts:", error);
  }
}




