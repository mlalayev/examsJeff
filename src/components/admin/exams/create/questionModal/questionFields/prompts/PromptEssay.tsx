"use client";

import { Question } from "../../../types";

interface PromptEssayProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptEssay({ question, onChange }: PromptEssayProps) {
  return (
    <div className="space-y-3">
      <textarea
        value={question.prompt?.text || ""}
        onChange={(e) => {
          onChange({
            ...question,
            prompt: { ...question.prompt, text: e.target.value },
          });
        }}
        placeholder="Enter the essay prompt (e.g., 'Write an essay about the importance of education...')"
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        rows={4}
      />
      <div className="pt-3 border-t border-gray-200 bg-yellow-50 p-3 rounded-md">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> Essays require manual grading. No auto-scoring will be applied.
        </p>
      </div>
    </div>
  );
}
