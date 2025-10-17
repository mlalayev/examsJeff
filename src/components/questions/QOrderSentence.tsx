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
      <div className="flex gap-2 items-center w-full flex-wrap">
        {order.map((tokenIdx: number, posIdx: number) => (
          <div
            key={posIdx}
            draggable={!readOnly}
            onDragStart={(e) => handleDragStart(e, posIdx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, posIdx)}
            className={`flex-1 min-w-[80px] flex items-center justify-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm ${
              !readOnly ? "cursor-move hover:border-gray-900 hover:bg-gray-50" : "cursor-default"
            } ${draggedIdx === posIdx ? "opacity-50" : ""}`}
          >
            <span className="text-gray-900 text-center font-medium">{tokens[tokenIdx] || "?"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}