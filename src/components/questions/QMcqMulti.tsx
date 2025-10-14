"use client";

import { BaseQuestionProps } from "./types";

export function QMcqMulti({ question, value, onChange, readOnly }: BaseQuestionProps<number[]>) {
  const choices = question.options?.choices || [];
  const selected = Array.isArray(value) ? value : [];

  const toggle = (idx: number) => {
    if (readOnly) return;
    if (selected.includes(idx)) {
      onChange(selected.filter((i) => i !== idx));
    } else {
      onChange([...selected, idx].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
      {choices.map((choice: string, idx: number) => (
        <label
          key={idx}
          className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(idx)}
            onChange={() => toggle(idx)}
            disabled={readOnly}
            className="h-4 w-4 disabled:opacity-50"
            aria-label={`Option ${idx + 1}: ${choice}`}
          />
          <span>{choice}</span>
        </label>
      ))}
    </div>
  );
}

