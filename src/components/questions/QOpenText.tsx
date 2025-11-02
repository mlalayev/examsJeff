"use client";

import { BaseQuestionProps } from "./types";

export function QOpenText({ question, value, onChange, readOnly }: BaseQuestionProps<string | Record<string, string>>) {
  // Handle both string and Record<string, string> values for GAP compatibility
  const currentValue = typeof value === 'string' ? value : (value?.['0'] || '');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const newValue = e.target.value;
    
    // If question is GAP type, store as Record<string, string>
    if (question.qtype === 'GAP') {
      onChange({ '0': newValue });
    } else {
      onChange(newValue);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        disabled={readOnly}
        className="w-full px-4 py-3.5 border rounded-lg text-base font-medium focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white shadow-sm hover:shadow"
        style={{
          borderColor: currentValue ? '#303380' : 'rgba(48, 51, 128, 0.2)',
          backgroundColor: currentValue ? 'rgba(48, 51, 128, 0.04)' : 'white',
          color: '#303380'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#303380';
          e.target.style.boxShadow = '0 0 0 3px rgba(48, 51, 128, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'none';
        }}
        placeholder="Type your answer here..."
      />
    </div>
  );
}
