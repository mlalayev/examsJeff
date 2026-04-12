"use client";

import { Question } from "../../../types";

interface PromptInlineSelectProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptInlineSelect({ question, onChange }: PromptInlineSelectProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={question.prompt?.text || ""}
        onChange={(e) => {
          onChange({
            ...question,
            prompt: { ...question.prompt, text: e.target.value },
          });
        }}
        placeholder="Enter the question text (use ___ for inline dropdown, or leave without ___ for dropdown at the end)"
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        rows={3}
      />
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
        <strong>Tip:</strong> Use ___ (3 underscores) where you want the dropdown to appear inline.
        If you don't use ___, the dropdown will appear at the end of the sentence.
        <br />
        <strong>Examples:</strong>
        <br />
        • "I ___ to school every day." → dropdown appears inline
        <br />
        • "What is the capital of France?" → dropdown appears at the end
      </div>
    </div>
  );
}
