"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QOrderSentence({ question, value, onChange, readOnly }: BaseQuestionProps<number[]>) {
  const tokens = question.prompt?.tokens || [];
  const order: number[] =
    Array.isArray(value) && value.length > 0
      ? value
      : tokens.map((_: any, i: number) => i);

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    if (readOnly) return;
    const next = order.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    onChange(next);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (readOnly) return;
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (readOnly || draggedIdx === null || draggedIdx === dropIdx) {
      setDraggedIdx(null);
      return;
    }

    const next = order.slice();
    const [removed] = next.splice(draggedIdx, 1);
    next.splice(dropIdx, 0, removed);
    onChange(next);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* Horizontal word boxes */}
      <div className="flex gap-2 items-center w-full">
        {order.map((tokenIdx: number, posIdx: number) => (
          <div
            key={posIdx}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, posIdx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, posIdx)}
            className={`flex-1 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
              !readOnly ? "cursor-move hover:border-blue-300 hover:shadow-md" : "cursor-default"
            } ${draggedIdx === posIdx ? "opacity-50 scale-95" : "hover:scale-105"}`}
            role="listitem"
            aria-label={`Position ${posIdx + 1}: ${tokens[tokenIdx]}`}
          >
            <span className="text-slate-800 text-center">{tokens[tokenIdx] || "?"}</span>
          </div>
        ))}
      </div>
      
    </div>
  );
}

