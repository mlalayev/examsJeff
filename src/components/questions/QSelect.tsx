"use client";

import { BaseQuestionProps } from "./types";

export function QSelect({ question, value, onChange, readOnly }: BaseQuestionProps<number | null>) {
  const choices = question.options?.choices || [];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (readOnly) return;
    const val = e.target.value;
    onChange(val === "" ? null : Number(val));
  };

  return (
    <select
      value={value ?? ""}
      onChange={handleChange}
      disabled={readOnly}
      className="mt-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Select an answer"
    >
      <option value="">Select an answer…</option>
      {choices.map((choice: string, idx: number) => (
        <option key={idx} value={idx}>
          {choice}
        </option>
      ))}
    </select>
  );
}

