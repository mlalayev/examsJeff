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
        <strong>Tip:</strong> Use <code className="bg-blue-100 px-1 rounded">___</code> (3 underscores) where you want each dropdown to appear.
        If you use multiple <code className="bg-blue-100 px-1 rounded">___</code>, each dropdown can have its own separate list of words in the Options section below.
        <br />
        <strong>Examples:</strong>
        <br />
        • &quot;I ___ to school and ___ the bus.&quot; → two dropdowns, each with its own word list
        <br />
        • &quot;What is the capital of France?&quot; → one dropdown at the end of the sentence
      </div>
    </div>
  );
}
