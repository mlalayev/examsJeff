"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";
import { normalizeTfAnswer } from "@/lib/question-answer-normalize";

export function QTF({ question, value, onChange, readOnly, onImageClick }: BaseQuestionProps<boolean | null>) {
  const imageUrl = question.prompt?.imageUrl;
  const selected = normalizeTfAnswer(value);

  const handleChange = (boolValue: boolean) => {
    if (readOnly) return;
    onChange(boolValue);
  };

  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} onClick={() => imageUrl && onImageClick?.(imageUrl)} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => handleChange(true)}
          disabled={readOnly}
          className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border transition-all shadow-sm ${
            selected === true
              ? "border-transparent shadow-md"
              : "bg-white hover:shadow border-gray-200"
          } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          style={
            selected === true
              ? {
                  backgroundColor: "#303380",
                  color: "white",
                  borderColor: "#303380",
                }
              : {
                  backgroundColor: "white",
                  color: "#374151",
                  borderColor: "rgba(48, 51, 128, 0.15)",
                }
          }
        >
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selected === true ? "border-white" : "border-gray-300"
            }`}
          >
            {selected === true && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
          </div>
          <span className="text-base font-medium">True</span>
        </button>

        <button
          type="button"
          onClick={() => handleChange(false)}
          disabled={readOnly}
          className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border transition-all shadow-sm ${
            selected === false
              ? "border-transparent shadow-md"
              : "bg-white hover:shadow border-gray-200"
          } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          style={
            selected === false
              ? {
                  backgroundColor: "#303380",
                  color: "white",
                  borderColor: "#303380",
                }
              : {
                  backgroundColor: "white",
                  color: "#374151",
                  borderColor: "rgba(48, 51, 128, 0.15)",
                }
          }
        >
          <div
            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              selected === false ? "border-white" : "border-gray-300"
            }`}
          >
            {selected === false && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
          </div>
          <span className="text-base font-medium">False</span>
        </button>
      </div>
    </div>
  );
}
