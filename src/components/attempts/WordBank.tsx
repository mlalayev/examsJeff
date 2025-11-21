"use client";

import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface WordBankProps {
  chips: Array<{ id: string; label: string }>;
  isOptionUsed: (label: string) => boolean;
  isLocked: boolean;
  wordBankPosition: number;
  maxPosition: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (label: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const WordBank = React.memo(function WordBank({
  chips,
  isOptionUsed,
  isLocked,
  wordBankPosition,
  maxPosition,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragEnd,
}: WordBankProps) {
  return (
    <div
      className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
      style={{
        borderColor: "rgba(15, 17, 80, 0.63)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4
            className="text-xs font-medium uppercase tracking-wide"
            style={{
              color: "rgba(48, 51, 128, 0.7)",
            }}
          >
            Word Bank
          </h4>
          <div className="flex gap-1">
            <button
              onClick={onMoveUp}
              disabled={wordBankPosition === 0}
              className={`p-1 rounded transition-all ${
                wordBankPosition === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 cursor-pointer"
              }`}
              title="Move Word Bank up"
            >
              <ChevronUp size={16} style={{ color: "#303380" }} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={wordBankPosition === maxPosition}
              className={`p-1 rounded transition-all ${
                wordBankPosition === maxPosition
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 cursor-pointer"
              }`}
              title="Move Word Bank down"
            >
              <ChevronDown size={16} style={{ color: "#303380" }} />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const used = isOptionUsed(chip.label);
            const canDrag = !isLocked && !used;
            return (
              <div
                key={chip.id}
                draggable={canDrag}
                onDragStart={(e) => {
                  if (!canDrag) {
                    e.preventDefault();
                    return;
                  }
                  onDragStart(chip.label, e);
                }}
                onDragEnd={(e) => {
                  e.preventDefault();
                  onDragEnd();
                }}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all select-none ${
                  canDrag ? "cursor-move" : "cursor-default"
                }`}
                style={
                  used
                    ? {
                        backgroundColor: "rgba(48, 51, 128, 0.05)",
                        borderColor: "rgba(48, 51, 128, 0.1)",
                        color: "rgba(48, 51, 128, 0.4)",
                      }
                    : {
                        backgroundColor: "rgba(48, 51, 128, 0.02)",
                        borderColor: "rgba(48, 51, 128, 0.15)",
                        color: "#303380",
                      }
                }
                onMouseEnter={(e) => {
                  if (canDrag) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(48, 51, 128, 0.05)";
                    e.currentTarget.style.borderColor =
                      "rgba(48, 51, 128, 0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (canDrag) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(48, 51, 128, 0.02)";
                    e.currentTarget.style.borderColor =
                      "rgba(48, 51, 128, 0.15)";
                  }
                }}
              >
                {chip.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

