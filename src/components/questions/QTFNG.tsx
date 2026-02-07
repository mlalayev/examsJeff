"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";

type TFNGValue = "TRUE" | "FALSE" | "NOT_GIVEN" | null;

export function QTFNG({ question, value, onChange, readOnly }: BaseQuestionProps<TFNGValue>) {
  const imageUrl = question.prompt?.imageUrl;

  const handleChange = (next: TFNGValue) => {
    if (readOnly) return;
    onChange(next);
  };

  const isSelected = (target: Exclude<TFNGValue, null>) => value === target;

  const baseClasses =
    "flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border transition-all shadow-sm";

  const getButtonStyles = (selected: boolean) =>
    selected
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

  return (
    <div className="space-y-3">
      <QuestionImage imageUrl={imageUrl} />
      <div className="flex flex-col sm:flex-row gap-3">
        {/* TRUE */}
        {(() => {
          const selected = isSelected("TRUE");
          const { className, style } = getButtonStyles(selected);
          return (
            <button
              type="button"
              onClick={() => handleChange("TRUE")}
              disabled={readOnly}
              className={className}
              style={style}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? "border-white" : "border-gray-300"
                }`}
              >
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
              </div>
              <span className="text-base font-medium">True</span>
            </button>
          );
        })()}

        {/* FALSE */}
        {(() => {
          const selected = isSelected("FALSE");
          const { className, style } = getButtonStyles(selected);
          return (
            <button
              type="button"
              onClick={() => handleChange("FALSE")}
              disabled={readOnly}
              className={className}
              style={style}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? "border-white" : "border-gray-300"
                }`}
              >
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
              </div>
              <span className="text-base font-medium">False</span>
            </button>
          );
        })()}

        {/* NOT GIVEN */}
        {(() => {
          const selected = isSelected("NOT_GIVEN");
          const { className, style } = getButtonStyles(selected);
          return (
            <button
              type="button"
              onClick={() => handleChange("NOT_GIVEN")}
              disabled={readOnly}
              className={className}
              style={style}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? "border-white" : "border-gray-300"
                }`}
              >
                {selected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
              </div>
              <span className="text-base font-medium whitespace-nowrap">Not Given</span>
            </button>
          );
        })()}
      </div>
    </div>
  );
}






