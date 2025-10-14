"use client";

import { BaseQuestionProps } from "./types";

export function QGap({ question, value, onChange, readOnly }: BaseQuestionProps<string>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      value={value || ""}
      onChange={handleChange}
      disabled={readOnly}
      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      placeholder="Type your answer"
      aria-label={question.prompt?.text || "Fill in the blank"}
    />
  );
}

