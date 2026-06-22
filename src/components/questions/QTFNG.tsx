"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";
import { normalizeTfngAnswer, type TfngAnswer } from "@/lib/question-answer-normalize";

export function QTFNG({
  question,
  value,
  onChange,
  readOnly,
  onImageClick,
}: BaseQuestionProps<TfngAnswer | null>) {
  const imageUrl = question.prompt?.imageUrl;
  const selected = normalizeTfngAnswer(value);

  const handleChange = (next: TfngAnswer) => {
    if (readOnly) return;
    onChange(next);
  };

  const baseClasses =
    "flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all shadow-sm";

  const getButtonStyles = (isSelected: boolean) =>
    isSelected
      ? {
          className: `${baseClasses} border-transparent shadow-md ${
            readOnly ? "opacity-70 cursor-not-allowed" : ""
          }`,
          style: {
            backgroundColor: "#303380",
            color: "white",
            borderColor: "#303380",
          } as React.CSSProperties,
        }
      : {
          className: `${baseClasses} bg-white hover:shadow border-gray-200 ${
            readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          }`,
          style: {
            backgroundColor: "white",
            color: "#374151",
            borderColor: "rgba(48, 51, 128, 0.15)",
          } as React.CSSProperties,
        };

  const options: { key: TfngAnswer; label: string }[] = [
    { key: "TRUE", label: "True" },
    { key: "FALSE", label: "False" },
    { key: "NOT_GIVEN", label: "Not Given" },
  ];

  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} onClick={() => imageUrl && onImageClick?.(imageUrl)} />
      <div className="flex flex-col sm:flex-row gap-3">
        {options.map(({ key, label }) => {
          const isSelected = selected === key;
          const { className, style } = getButtonStyles(isSelected);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleChange(key)}
              disabled={readOnly}
              className={className}
              style={style}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? "border-white" : "border-gray-300"
                }`}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
              </div>
              <span className={`text-base font-medium ${key === "NOT_GIVEN" ? "whitespace-nowrap" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
