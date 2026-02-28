"use client";

import React from "react";
import { Clock, Check } from "lucide-react";

export interface PartProgress {
  answered: number;
  total: number;
  percentage: number;
}

interface IELTSPartsTimerBarProps {
  partCount: number;
  partLabel?: "P" | "T"; // P = Part, T = Task (Writing)
  partProgress: PartProgress[];
  currentPart: number;
  onPartChange?: (part: number) => void;
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (seconds: number) => string;
  getTimeColor: () => string;
}

const ACCENT = "#303380";
const DONE = "#059669";

export function IELTSPartsTimerBar({
  partCount,
  partLabel = "P",
  partProgress,
  currentPart,
  onPartChange,
  timeRemaining,
  isExpired,
  formatTime,
  getTimeColor,
}: IELTSPartsTimerBarProps) {
  const timeColor =
    getTimeColor() === "text-red-600"
      ? "#dc2626"
      : getTimeColor() === "text-orange-600"
        ? "#ea580c"
        : "rgb(55 65 81)";

  return (
    <div className="group fixed top-4 right-4 z-50 flex flex-row justify-end">
      <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-gray-200/90 shadow-lg shadow-gray-200/50 bg-white">
        {/* Parts – slide in from left on hover */}
        <div className="overflow-hidden transition-[max-width] duration-300 ease-out max-w-0 group-hover:max-w-[320px] flex items-stretch shrink-0">
          <div className="flex items-stretch w-max">
            {Array.from({ length: partCount }, (_, i) => i + 1).map((partNum, idx) => {
              const progress = partProgress[idx] ?? { answered: 0, total: 1, percentage: 0 };
              const isActive = currentPart === partNum;
              const isDone = progress.percentage >= 100;

              return (
                <React.Fragment key={partNum}>
                  {idx > 0 && (
                    <div className="w-px shrink-0 self-stretch my-2 rounded-full bg-gray-200" aria-hidden />
                  )}
                  <button
                    type="button"
                    onClick={() => onPartChange?.(partNum)}
                    className={`
                      relative flex flex-col items-center justify-center min-w-[56px] px-3 py-2.5
                      transition-colors duration-200
                      ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-50"}
                    `}
                    style={isActive ? { backgroundColor: ACCENT } : undefined}
                    title={`${partLabel}${partNum}: ${progress.answered}/${progress.total}`}
                  >
                    <span className="text-xs font-semibold tracking-tight">
                      {partLabel}{partNum}
                    </span>
                    <div
                      className="mt-1.5 h-0.5 w-8 rounded-full overflow-hidden"
                      style={{
                        backgroundColor: isActive ? "rgba(255,255,255,0.35)" : "rgb(229 231 235)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, progress.percentage)}%`,
                          backgroundColor: isActive ? "white" : isDone ? DONE : ACCENT,
                        }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium mt-0.5 tabular-nums ${isActive ? "text-white/90" : "text-gray-500"}`}
                    >
                      {progress.answered}/{progress.total}
                    </span>
                    {isDone && (
                      <span
                        className={`absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        <Check className="h-2 w-2" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div
          className="w-px shrink-0 self-stretch my-2 rounded-full bg-gray-200 overflow-hidden max-w-0 group-hover:max-w-[1px] transition-[max-width] duration-300 ease-out"
          aria-hidden
        />

        {/* Timer – always visible */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 min-w-[100px] bg-gray-50"
          style={
            isExpired
              ? { backgroundColor: "rgb(254 226 226)", color: "#dc2626" }
              : { color: timeColor }
          }
        >
          <Clock className="w-4 h-4 shrink-0 opacity-80" style={{ color: "inherit" }} />
          <span className="text-base font-bold tabular-nums tracking-tight" style={{ color: "inherit" }}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
