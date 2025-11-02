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
    <div className="space-y-3">
      <select
        value={value ?? ""}
        onChange={handleChange}
        disabled={readOnly}
        className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        style={{
          borderColor: 'rgba(48, 51, 128, 0.2)',
          backgroundColor: 'rgba(48, 51, 128, 0.02)',
          color: '#303380'
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
      >
        <option value="" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>Select an answer...</option>
        {choices.map((choice: string, idx: number) => (
          <option key={idx} value={idx} style={{ color: '#303380' }}>
            {choice}
          </option>
        ))}
      </select>
      <p className="text-xs" style={{ color: 'rgba(48, 51, 128, 0.6)' }}>
        Choose your answer from the dropdown menu above
      </p>
    </div>
  );
}