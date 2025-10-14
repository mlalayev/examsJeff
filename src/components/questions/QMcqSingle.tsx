"use client";

import { BaseQuestionProps } from "./types";

export function QMcqSingle({ question, value, onChange, readOnly }: BaseQuestionProps<number | null>) {
  const choices = question.options?.choices || [];

  const handleChange = (idx: number) => {
    if (readOnly) return;
    onChange(idx);
  };

  return (
    <div className="space-y-2">
      {choices.map((choice: string, idx: number) => (
        <label
          key={idx}
          className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
        >
          <input
            type="radio"
            name={question.id}
            checked={value === idx}
            onChange={() => handleChange(idx)}
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

