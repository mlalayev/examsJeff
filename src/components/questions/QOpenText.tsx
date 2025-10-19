"use client";

import { BaseQuestionProps } from "./types";

export function QOpenText({ question, value, onChange, readOnly }: BaseQuestionProps<string>) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        disabled={readOnly}
        className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: 'rgba(48, 51, 128, 0.2)',
          backgroundColor: 'rgba(48, 51, 128, 0.02)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#303380';
          e.target.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
          e.target.style.boxShadow = '0 0 0 3px rgba(48, 51, 128, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(48, 51, 128, 0.2)';
          e.target.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
          e.target.style.boxShadow = 'none';
        }}
        placeholder="Type your answer here..."
      />
      <p className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
        Write your answer in the box above
      </p>
    </div>
  );
}
