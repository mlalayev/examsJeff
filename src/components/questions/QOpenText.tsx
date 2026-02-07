"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";

export function QOpenText({ question, value, onChange, readOnly }: BaseQuestionProps<string | Record<string, string>>) {
  // Handle both string and Record<string, string> values for GAP compatibility
  const currentValue = typeof value === 'string' ? value : (value?.['0'] || '');
  const promptText = question.prompt?.text || '';
  const imageUrl = question.prompt?.imageUrl;
  
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

  // Check if prompt has blank markers (for inline rendering)
  const hasBlankMarker = promptText.includes('____') || promptText.includes('___');
  
  if (hasBlankMarker && question.qtype === 'GAP') {
    // Render inline with blank marker replaced by input field
    const parts = promptText.split(/____+|___+/);
    
    return (
      <div className="space-y-3">
        <QuestionImage imageUrl={imageUrl} />
        <div className="text-base leading-relaxed" style={{ lineHeight: '1.7' }}>
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <span className="inline-block relative mx-1 align-middle">
                  <input
                    type="text"
                    value={currentValue}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="inline-block min-w-[120px] px-3 py-1.5 border rounded-md text-base font-medium focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white shadow-sm"
                    style={{
                      borderColor: currentValue ? '#303380' : 'rgba(48, 51, 128, 0.2)',
                      backgroundColor: currentValue ? 'rgba(48, 51, 128, 0.04)' : 'white',
                      color: '#303380',
                      verticalAlign: 'baseline'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#303380';
                      e.target.style.boxShadow = '0 0 0 2px rgba(48, 51, 128, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Type here..."
                  />
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Default: full-width input field
  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} />
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
