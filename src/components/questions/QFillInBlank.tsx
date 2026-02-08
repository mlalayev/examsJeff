"use client";

import React from "react";

interface QFillInBlankProps {
  question: {
    id: string;
    prompt: {
      text: string; // Text with [input] placeholders
      instructions?: string; // What to do text
      title?: string; // Optional question title/name
      imageUrl?: string | null; // Image URL (mapped from question.image)
    };
    image?: string | null;
    answerKey?: string[]; // Array of correct answers for each blank
  };
  value?: Record<string, string>; // { "0": "answer1", "1": "answer2", ... }
  onChange?: (value: Record<string, string>) => void;
  readOnly?: boolean;
  onImageClick?: (imageUrl: string) => void;
}

export function QFillInBlank({
  question,
  value = {},
  onChange,
  readOnly = false,
  onImageClick,
}: QFillInBlankProps) {
  // Parse text to find [input] placeholders
  const parseText = (text: string) => {
    const parts: Array<{ type: "text" | "input"; content: string; index?: number }> = [];
    let lastIndex = 0;
    let inputIndex = 0;
    
    const regex = /\[input\]/gi;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the input
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }
      
      // Add input placeholder
      parts.push({
        type: "input",
        content: "",
        index: inputIndex,
      });
      
      lastIndex = match.index + match[0].length;
      inputIndex++;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }
    
    return parts;
  };

  const handleInputChange = (index: number, inputValue: string) => {
    if (readOnly || !onChange) return;
    
    const newValue = { ...value, [index.toString()]: inputValue };
    onChange(newValue);
  };

  const parts = parseText(question.prompt.text || "");
  const totalInputs = parts.filter((p) => p.type === "input").length;

  return (
    <div className="space-y-3">
      {/* Question Title */}
      {question.prompt.title && (
        <div className="mb-2">
          <h3 className="text-base font-semibold text-gray-900">
            {question.prompt.title}
          </h3>
        </div>
      )}

      {/* Instructions */}
      {question.prompt.instructions && (
        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            {question.prompt.instructions}
          </p>
        </div>
      )}

      {/* Image */}
      {(question.image || question.prompt.imageUrl) && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
          <div className="relative w-full flex justify-center" style={{ minHeight: "200px" }}>
            <img
              src={question.image || question.prompt.imageUrl || ""}
              alt="Question image"
              onClick={() => {
                const imageUrl = question.image || question.prompt.imageUrl;
                if (imageUrl) onImageClick?.(imageUrl);
              }}
              className="h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              style={{ width: "90%", minWidth: "90%", maxHeight: "400px" }}
            />
          </div>
        </div>
      )}

      {/* Text with inputs */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="text-base leading-relaxed text-gray-800">
          {parts.map((part, idx) => {
            if (part.type === "text") {
              return (
                <span key={idx} className="whitespace-pre-wrap">
                  {part.content}
                </span>
              );
            } else {
              // Input field
              const inputIndex = part.index!;
              return (
                <input
                  key={idx}
                  type="text"
                  value={value[inputIndex.toString()] || ""}
                  onChange={(e) => handleInputChange(inputIndex, e.target.value)}
                  disabled={readOnly}
                  className="inline-block mx-1 px-3 py-1 border-b-2 border-blue-400 bg-blue-50/50 text-gray-900 text-base focus:outline-none focus:border-blue-600 focus:bg-blue-50 disabled:bg-gray-100 disabled:border-gray-300 min-w-[120px] max-w-[200px]"
                  placeholder={readOnly ? "—" : `Answer ${inputIndex + 1}`}
                  style={{ 
                    width: `${Math.max(120, (value[inputIndex.toString()] || "").length * 12 + 40)}px` 
                  }}
                />
              );
            }
          })}
        </div>
        
        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          Total blanks: {totalInputs} {totalInputs === 1 ? "blank" : "blanks"}
        </div>
      </div>
    </div>
  );
}

