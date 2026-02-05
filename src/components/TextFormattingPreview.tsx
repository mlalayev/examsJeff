"use client";

import React, { useState } from "react";
import { parseFormattedText, getFormattingExamples } from "@/lib/text-formatter";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

interface TextFormattingPreviewProps {
  text: string;
  className?: string;
}

export default function TextFormattingPreview({ text, className = "" }: TextFormattingPreviewProps) {
  const [showGuide, setShowGuide] = useState(false);
  const segments = parseFormattedText(text);

  const getSegmentClassName = (segment: any) => {
    const classes: string[] = [];
    if (segment.bold) classes.push("font-bold");
    if (segment.underline) classes.push("underline");
    if (segment.strikethrough) classes.push("line-through");
    if (segment.italic) classes.push("italic");
    return classes.join(" ");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Preview */}
      <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-600">Preview:</span>
        </div>
        <div className="text-sm text-gray-900 min-h-[24px] leading-relaxed">
          {segments.length > 0 ? (
            segments.map((segment, idx) => (
              <span key={idx} className={getSegmentClassName(segment)}>
                {segment.text}
              </span>
            ))
          ) : (
            <span className="text-gray-400 italic">Type something to see the preview...</span>
          )}
        </div>
      </div>

      {/* Formatting Guide Toggle */}
      <button
        type="button"
        onClick={() => setShowGuide(!showGuide)}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Text formatting guide</span>
        {showGuide ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Formatting Guide */}
      {showGuide && (
        <div className="border border-blue-200 rounded-md p-3 bg-blue-50 space-y-2">
          <p className="text-xs font-medium text-blue-900 mb-2">Available formatting:</p>
          <div className="space-y-1.5">
            {getFormattingExamples().map((example, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <code className="flex-1 bg-white px-2 py-1 rounded border border-blue-200 text-blue-900 font-mono">
                  {example.syntax}
                </code>
                <span className="text-gray-600 flex-shrink-0 w-32">{example.description}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3 pt-2 border-t border-blue-200">
            <strong>Tip:</strong> You can combine formats, like{" "}
            <code className="bg-white px-1.5 py-0.5 rounded text-blue-900 font-mono">
              __**text**__
            </code>{" "}
            for bold + underline.
          </p>
        </div>
      )}
    </div>
  );
}













