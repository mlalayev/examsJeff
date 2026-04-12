"use client";

import { Question } from "../../../types";

interface PromptOrderSentenceProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptOrderSentence({ question, onChange }: PromptOrderSentenceProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={question.prompt?.rawText !== undefined
          ? question.prompt.rawText
          : (Array.isArray(question.prompt?.tokens) ? question.prompt.tokens.join("\n") : "")}
        onChange={(e) => {
          const rawText = e.target.value;
          const tokens = rawText.split("\n").filter((line) => line.trim() !== "");
          onChange({
            ...question,
            prompt: {
              tokens,
              rawText
            },
            answerKey: { order: tokens.map((_, idx) => idx) },
          });
        }}
        placeholder="Enter tokens (one per line)"
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
        rows={5}
      />
      <p className="text-xs text-gray-500">Enter tokens one per line. They will be shuffled for students.</p>
    </div>
  );
}
