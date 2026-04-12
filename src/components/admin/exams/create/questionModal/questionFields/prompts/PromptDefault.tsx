"use client";

import { Question } from "../../../types";
import { Info } from "lucide-react";
import FormattedText from "@/components/FormattedText";

interface PromptDefaultProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptDefault({ question, onChange }: PromptDefaultProps) {
  return (
    <>
      <textarea
        value={question.prompt?.text || ""}
        onChange={(e) => {
          onChange({
            ...question,
            prompt: { ...question.prompt, text: e.target.value },
          });
        }}
        placeholder="Enter the question text"
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        rows={3}
      />
      <div className="mt-2 text-xs text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-center gap-2">
        <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <span>
          <strong>Text Formatting:</strong> **bold** | __underline__ | ~~strikethrough~~ | &&italic&&
        </span>
      </div>
    </>
  );
}
