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
    <div className="space-y-2">
      {order.map((tokenIdx: number, posIdx: number) => (
        <div
          key={posIdx}
          draggable={!readOnly}
          onDragStart={(e) => handleDragStart(e, posIdx)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, posIdx)}
          className={`flex items-center justify-between bg-gray-50 border rounded px-3 py-2 text-sm ${
            !readOnly ? "cursor-move" : "cursor-default"
          } ${draggedIdx === posIdx ? "opacity-50" : ""}`}
          role="listitem"
          aria-label={`Position ${posIdx + 1}: ${tokens[tokenIdx]}`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-6 text-center text-gray-400 font-medium">
              {posIdx + 1}.
            </span>
            <span className="font-medium text-gray-800">{tokens[tokenIdx] || "?"}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => move(posIdx, -1)}
              disabled={readOnly || posIdx === 0}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(posIdx, +1)}
              disabled={readOnly || posIdx === order.length - 1}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Move down"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

