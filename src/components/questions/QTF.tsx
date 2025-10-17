"use client";

import { BaseQuestionProps } from "./types";

export function QTF({ question, value, onChange, readOnly }: BaseQuestionProps<boolean | null>) {
  const handleChange = (val: boolean) => {
    if (readOnly) return;
    onChange(val);
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={() => handleChange(true)}
        disabled={readOnly}
        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
          value === true
            ? "bg-gray-900 border-gray-900 text-white"
            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        } ${readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          value === true ? "border-white" : "border-gray-300"
        }`}>
          {value === true && <div className="w-2 h-2 rounded-full bg-white"></div>}
        </div>
        <span className="text-sm font-medium">True</span>
      </button>
      
      <button
        onClick={() => handleChange(false)}
        disabled={readOnly}
        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border transition-all ${
          value === false
            ? "bg-gray-900 border-gray-900 text-white"
            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        } ${readOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          value === false ? "border-white" : "border-gray-300"
        }`}>
          {value === false && <div className="w-2 h-2 rounded-full bg-white"></div>}
        </div>
        <span className="text-sm font-medium">False</span>
      </button>
    </div>
  );
}