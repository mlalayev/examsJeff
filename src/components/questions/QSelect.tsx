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
      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">Select an answer...</option>
      {choices.map((choice: string, idx: number) => (
        <option key={idx} value={idx}>
          {choice}
        </option>
      ))}
    </select>
  );
}