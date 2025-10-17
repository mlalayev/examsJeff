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
        <button
          key={idx}
          onClick={() => toggle(idx)}
          disabled={readOnly}
          className={`w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg border transition-all ${
            selected.includes(idx)
              ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          } ${readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            selected.includes(idx) ? "border-white bg-white" : "border-gray-300"
          }`}>
            {selected.includes(idx) && (
              <svg
                className="w-3 h-3 text-gray-900"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm">{choice}</span>
        </button>
      ))}
    </div>
  );
}