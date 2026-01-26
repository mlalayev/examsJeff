"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";
import FormattedText from "../FormattedText";

export function QMcqSingle({ question, value, onChange, readOnly }: BaseQuestionProps<number | null>) {
  const choices = question.options?.choices || [];
  const choiceImages = question.options?.choiceImages || [];
  const imageUrl = question.prompt?.imageUrl;

  const handleChange = (idx: number) => {
    if (readOnly) return;
    onChange(idx);
  };

  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} />
      {choices.map((choice: string, idx: number) => {
        const choiceImage = choiceImages[idx];
        return (
          <button
            key={idx}
            onClick={() => handleChange(idx)}
            disabled={readOnly}
            className={`w-full text-left flex items-start space-x-4 px-5 py-3.5 rounded-lg border transition-all shadow-sm ${
              value === idx
                ? "border-transparent shadow-md"
                : "bg-white hover:shadow border-gray-200"
            } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            style={value === idx ? {
              backgroundColor: '#303380',
              color: 'white',
              borderColor: '#303380'
            } : {
              backgroundColor: 'white',
              color: '#374151',
              borderColor: 'rgba(48, 51, 128, 0.15)'
            }}
            onMouseEnter={(e) => {
              if (value !== idx && !readOnly) {
                e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
                e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (value !== idx && !readOnly) {
                e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
              value === idx ? "border-white" : "border-gray-300"
            }`}>
              {value === idx && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
            </div>
            <div className="flex-1">
              <div className="text-base font-medium">
                <FormattedText text={choice} />
              </div>
              {choiceImage && (
                <div className="mt-2">
                  <img
                    src={choiceImage}
                    alt={`Option ${idx + 1}`}
                    className="max-h-32 w-auto rounded border border-gray-300"
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}