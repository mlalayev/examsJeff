"use client";

import { Question } from "../../../types";

interface PromptShortTextProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptShortText({ question, onChange }: PromptShortTextProps) {
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
        placeholder="Enter the question text (e.g., 'What is the capital of France?')"
        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        rows={3}
      />
      <div className="pt-3 border-t border-gray-200">
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Correct Answers (one per line, case-insensitive)
        </label>
        <textarea
          value={Array.isArray(question.answerKey?.answers) ? question.answerKey.answers.join("\n") : ""}
          onChange={(e) => {
            const answers = e.target.value.split("\n");
            onChange({
              ...question,
              answerKey: { answers },
            });
          }}
          placeholder="Enter possible correct answers (one per line)&#10;answer1&#10;answer2&#10;answer3"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          Students can enter any of these answers (case-insensitive matching).
        </p>
      </div>
    </div>
  );
}
