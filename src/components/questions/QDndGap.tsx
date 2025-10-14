"use client";

import { BaseQuestionProps } from "./types";

export function QDndGap({ question, value, onChange, readOnly }: BaseQuestionProps<string[]>) {
  const bank = question.options?.bank || [];
  const textWithBlanks = question.prompt?.textWithBlanks || "";
  const blanks: string[] = Array.isArray(value) ? value : [];
  const blankCount = (textWithBlanks.match(/_+/g) || []).length;

  const setBl = (idx: number, word: string) => {
    if (readOnly) return;
    const next = [...blanks];
    while (next.length < blankCount) next.push("");
    next[idx] = word;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
        {textWithBlanks}
      </div>
      <div className="flex flex-wrap gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
        <span className="text-xs text-blue-700 font-medium w-full">Word Bank:</span>
        {bank.map((word: string, i: number) => (
          <span
            key={i}
            className="px-3 py-1 bg-white border border-blue-300 rounded-md text-sm font-medium text-blue-900 shadow-sm"
          >
            {word}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: blankCount }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <label htmlFor={`blank-${idx}`} className="text-sm text-gray-600 min-w-[80px]">
              Blank {idx + 1}:
            </label>
            <select
              id={`blank-${idx}`}
              value={blanks[idx] || ""}
              onChange={(e) => setBl(idx, e.target.value)}
              disabled={readOnly}
              className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Fill blank ${idx + 1}`}
              aria-invalid={!blanks[idx]}
            >
              <option value="">— Select word —</option>
              {bank.map((word: string, i: number) => (
                <option key={i} value={word}>
                  {word}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

