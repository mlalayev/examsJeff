"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { IELTSAudioPlayer } from "@/components/audio/IELTSAudioPlayer";
import { GripVertical, Headphones } from "lucide-react";

const LISTENING_PLAYER_POS_KEY = (attemptId: string | undefined, sectionId: string) =>
  `ielts_listening_player_pos_${attemptId ?? "guest"}_${sectionId}`;

const EST_PANEL_W = 380;
const EST_PANEL_H = 240;
const VIEW_MARGIN = 10;

function clampListeningPanelPos(
  x: number,
  y: number,
  panelW: number,
  panelH: number
): { x: number; y: number } {
  if (typeof window === "undefined") return { x, y };
  const maxX = Math.max(VIEW_MARGIN, window.innerWidth - panelW - VIEW_MARGIN);
  const maxY = Math.max(VIEW_MARGIN, window.innerHeight - panelH - VIEW_MARGIN);
  return {
    x: Math.min(Math.max(VIEW_MARGIN, x), maxX),
    y: Math.min(Math.max(VIEW_MARGIN, y), maxY),
  };
}

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

// IELTS Listening: 30 minutes
const IELTS_DURATION_MIN = 30;

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

type PanelPos = { x: number; y: number };

function defaultListeningPanelPos(): PanelPos {
  if (typeof window === "undefined") return { x: 24, y: 88 };
  return clampListeningPanelPos(
    Math.max(VIEW_MARGIN, window.innerWidth - EST_PANEL_W - VIEW_MARGIN),
    Math.max(VIEW_MARGIN, window.innerHeight - EST_PANEL_H - VIEW_MARGIN * 2),
    EST_PANEL_W,
    EST_PANEL_H
  );
}

function DraggableListeningAudioPanel({
  src,
  attemptId,
  sectionId,
}: {
  src: string;
  attemptId?: string;
  sectionId: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [panelPos, setPanelPos] = useState<PanelPos>(() => ({ x: 24, y: 88 }));
  const panelPosRef = useRef(panelPos);
  panelPosRef.current = panelPos;

  const readSavedPos = (): PanelPos | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LISTENING_PLAYER_POS_KEY(attemptId, sectionId));
      if (!raw) return null;
      const p = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof p.x === "number" && typeof p.y === "number" && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        return { x: p.x, y: p.y };
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  const persistPos = (p: PanelPos) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LISTENING_PLAYER_POS_KEY(attemptId, sectionId), JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const clampWithMeasuredSize = (x: number, y: number): PanelPos => {
    const el = panelRef.current;
    const w = el?.getBoundingClientRect().width ?? EST_PANEL_W;
    const h = el?.getBoundingClientRect().height ?? EST_PANEL_H;
    return clampListeningPanelPos(x, y, w, h);
  };

  useLayoutEffect(() => {
    const saved = readSavedPos();
    const initial = saved
      ? clampListeningPanelPos(saved.x, saved.y, EST_PANEL_W, EST_PANEL_H)
      : defaultListeningPanelPos();
    setPanelPos(initial);
    const id = requestAnimationFrame(() => {
      setPanelPos((prev) => clampWithMeasuredSize(prev.x, prev.y));
    });
    return () => cancelAnimationFrame(id);
  }, [attemptId, sectionId]);

  useEffect(() => {
    const onResize = () => {
      setPanelPos((prev) => clampWithMeasuredSize(prev.x, prev.y));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: panelPosRef.current.x,
      origY: panelPosRef.current.y,
    };
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const nx = d.origX + (e.clientX - d.startX);
    const ny = d.origY + (e.clientY - d.startY);
    setPanelPos(clampWithMeasuredSize(nx, ny));
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    setPanelPos((prev) => {
      const c = clampWithMeasuredSize(prev.x, prev.y);
      persistPos(c);
      return c;
    });
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-[100] w-[min(100vw-1.5rem,24rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
      style={{ left: panelPos.x, top: panelPos.y, touchAction: "none" }}
      role="region"
      aria-label="Listening audio player"
    >
      <div
        className="mb-3 flex cursor-grab select-none items-stretch gap-2 rounded-lg border border-gray-100 bg-gray-50/80 active:cursor-grabbing"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          if (!dragRef.current) return;
          dragRef.current = null;
          setPanelPos((prev) => {
            const c = clampWithMeasuredSize(prev.x, prev.y);
            persistPos(c);
            return c;
          });
        }}
        style={{ touchAction: "none" }}
      >
        <div className="flex shrink-0 items-center justify-center px-1 text-gray-400" aria-hidden>
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 py-2 pr-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <Headphones className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Listening</h3>
              <p className="text-xs text-gray-500">Drag this bar to move the player.</p>
            </div>
          </div>
        </div>
      </div>
      <IELTSAudioPlayer src={src} className="w-full" attemptId={attemptId} sectionId={sectionId} />
    </div>
  );
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
        <DraggableListeningAudioPanel src={audioSource} attemptId={attemptId} sectionId={section.id} />
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

