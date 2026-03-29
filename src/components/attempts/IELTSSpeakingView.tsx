"use client";

import React from "react";

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
  attemptId?: string;
  onTimerStateChange?: (state: IELTSSpeakingTimerState | null) => void;
}

/**
 * IELTS Speaking uses per-question timers in the question card footer only (no separate 20‑minute sidebar timer).
 */
export function IELTSSpeakingView(_props: IELTSSpeakingViewProps) {
  return null;
}
