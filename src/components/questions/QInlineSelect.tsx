"use client";

import { BaseQuestionProps } from "./types";

export function QInlineSelect({ question, value, onChange, readOnly }: BaseQuestionProps<number | null>) {
  const choices = question.options?.choices || [];
  const promptText = question.prompt?.text || "";
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (readOnly) return;
    const val = e.target.value;
    onChange(val === "" ? null : Number(val));
  };

  // Find the selected choice text
  const selectedText = value !== null && value !== undefined && choices[value] ? choices[value] : "";

  // Check if prompt has blank markers
  const hasBlankMarker = /____+|___+/.test(promptText);

  // Dropdown component (reusable)
  const DropdownSelect = () => (
    <span className="inline-block relative mx-1 align-middle">
      <select
        value={value ?? ""}
        onChange={handleChange}
        disabled={readOnly}
        className="inline-block min-w-[120px] px-3 py-1.5 pr-7 border rounded-md text-base font-medium focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white appearance-none cursor-pointer shadow-sm hover:shadow"
        style={{
          borderColor: value !== null && value !== undefined ? '#303380' : 'rgba(48, 51, 128, 0.2)',
          backgroundColor: value !== null && value !== undefined ? 'rgba(48, 51, 128, 0.04)' : 'white',
          color: value !== null && value !== undefined ? '#303380' : 'rgba(107, 114, 128, 0.7)',
          verticalAlign: 'baseline'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#303380';
          e.target.style.boxShadow = '0 0 0 2px rgba(48, 51, 128, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
      >
        <option value="" disabled style={{ color: 'rgba(107, 114, 128, 0.7)' }}>
          {selectedText || "Select..."}
        </option>
        {choices.map((choice: string, idx: number) => (
          <option key={idx} value={idx} style={{ color: '#303380' }}>
            {choice}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(48, 51, 128, 0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </span>
  );

  // If has blank marker, show inline
  if (hasBlankMarker) {
    const parts = promptText.split(/____+|___+/);
    return (
      <div className="text-base leading-relaxed" style={{ lineHeight: '1.7' }}>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && <DropdownSelect />}
          </span>
        ))}
      </div>
    );
  }

  // If no blank marker, show dropdown at the end
  return (
    <div className="text-base leading-relaxed" style={{ lineHeight: '1.7' }}>
      <span>{promptText}</span>
      {" "}
      <DropdownSelect />
    </div>
  );
}

