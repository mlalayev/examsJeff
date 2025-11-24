"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";

export function QMcqMulti({ question, value, onChange, readOnly }: BaseQuestionProps<number[]>) {
  const choices = question.options?.choices || [];
  const selectedIndices = Array.isArray(value) ? value : [];
  const imageUrl = question.prompt?.imageUrl;

  const handleToggle = (idx: number) => {
    if (readOnly) return;
    const newIndices = selectedIndices.includes(idx)
      ? selectedIndices.filter(i => i !== idx)
      : [...selectedIndices, idx].sort();
    onChange(newIndices);
  };

  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} />
      {choices.map((choice: string, idx: number) => {
        const isSelected = selectedIndices.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => handleToggle(idx)}
            disabled={readOnly}
            className={`w-full text-left flex items-center space-x-4 px-5 py-3.5 rounded-lg border transition-all shadow-sm ${
              isSelected
                ? "border-transparent shadow-md"
                : "bg-white hover:shadow border-gray-200"
            } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            style={isSelected ? {
              backgroundColor: '#303380',
              color: 'white',
              borderColor: '#303380'
            } : {
              backgroundColor: 'white',
              color: '#374151',
              borderColor: 'rgba(48, 51, 128, 0.15)'
            }}
            onMouseEnter={(e) => {
              if (!isSelected && !readOnly) {
                e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
                e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !readOnly) {
                e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected ? "border-white bg-white" : "border-gray-300 bg-white"
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-base font-medium">{choice}</span>
          </button>
        );
      })}
    </div>
  );
}


