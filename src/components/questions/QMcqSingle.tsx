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
        <button
          key={idx}
          onClick={() => handleChange(idx)}
          disabled={readOnly}
          className={`w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg border transition-all ${
            value === idx
              ? "bg-gray-900 border-gray-900 text-white"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          } ${readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            value === idx ? "border-white" : "border-gray-300"
          }`}>
            {value === idx && <div className="w-2 h-2 rounded-full bg-white"></div>}
          </div>
          <span className="text-sm">{choice}</span>
        </button>
      ))}
    </div>
  );
}