"use client";

import { BaseQuestionProps } from "./types";

export function QTF({ question, value, onChange, readOnly }: BaseQuestionProps<boolean | null>) {
  const handleChange = (boolValue: boolean) => {
    if (readOnly) return;
    onChange(boolValue);
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleChange(true)}
        disabled={readOnly}
        className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border transition-all shadow-sm ${
          value === true
            ? "border-transparent shadow-md"
            : "bg-white hover:shadow border-gray-200"
        } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        style={value === true ? {
          backgroundColor: '#303380',
          color: 'white',
          borderColor: '#303380'
        } : {
          backgroundColor: 'white',
          color: '#374151',
          borderColor: 'rgba(48, 51, 128, 0.15)'
        }}
        onMouseEnter={(e) => {
          if (value !== true && !readOnly) {
            e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
            e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== true && !readOnly) {
            e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          value === true ? "border-white" : "border-gray-300"
        }`}>
          {value === true && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
        </div>
        <span className="text-base font-medium">True</span>
      </button>

      <button
        onClick={() => handleChange(false)}
        disabled={readOnly}
        className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border transition-all shadow-sm ${
          value === false
            ? "border-transparent shadow-md"
            : "bg-white hover:shadow border-gray-200"
        } ${readOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        style={value === false ? {
          backgroundColor: '#303380',
          color: 'white',
          borderColor: '#303380'
        } : {
          backgroundColor: 'white',
          color: '#374151',
          borderColor: 'rgba(48, 51, 128, 0.15)'
        }}
        onMouseEnter={(e) => {
          if (value !== false && !readOnly) {
            e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
            e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== false && !readOnly) {
            e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          value === false ? "border-white" : "border-gray-300"
        }`}>
          {value === false && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
        </div>
        <span className="text-base font-medium">False</span>
      </button>
    </div>
  );
}


