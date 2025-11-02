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
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={handleChange}
        disabled={readOnly}
        className="w-full px-4 py-3.5 border rounded-lg text-base font-medium focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white appearance-none cursor-pointer shadow-sm hover:shadow"
        style={{
          borderColor: value !== null && value !== undefined ? '#303380' : 'rgba(48, 51, 128, 0.2)',
          backgroundColor: value !== null && value !== undefined ? 'rgba(48, 51, 128, 0.04)' : 'white',
          color: '#303380',
          paddingRight: '2.5rem'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#303380';
          e.target.style.boxShadow = '0 0 0 3px rgba(48, 51, 128, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="" disabled style={{ color: 'rgba(107, 114, 128, 0.7)' }}>Select an answer...</option>
        {choices.map((choice: string, idx: number) => (
          <option key={idx} value={idx} style={{ color: '#303380', padding: '0.5rem' }}>
            {choice}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6L8 10L12 6" stroke="rgba(48, 51, 128, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}