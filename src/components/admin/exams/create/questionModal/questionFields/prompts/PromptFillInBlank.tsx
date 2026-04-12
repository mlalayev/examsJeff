"use client";

import { Question } from "../../../types";
import ImageUpload from "@/components/ImageUpload";

interface PromptFillInBlankProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptFillInBlank({ question, onChange }: PromptFillInBlankProps) {
  return (
    <div className="space-y-3">
      {/* Question Title/Name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Question Name (Optional)
        </label>
        <input
          type="text"
          value={question.prompt?.title || ""}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: {
                ...question.prompt,
                title: e.target.value
              },
            });
          }}
          placeholder="e.g., Complete the form below"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        />
      </div>

      {/* Instructions/What to do */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Instructions (What to do)
        </label>
        <textarea
          value={question.prompt?.instructions || ""}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: { ...question.prompt, instructions: e.target.value },
            });
          }}
          placeholder="Fill in the blanks with appropriate words"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          rows={2}
        />
      </div>

      {/* Text with [input] placeholders */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Text with blanks (use [input] for each blank)
        </label>
        <textarea
          value={question.prompt?.text || ""}
          onChange={(e) => {
            const text = e.target.value;
            // Count [input] occurrences
            const inputCount = (text.match(/\[input\]/gi) || []).length;

            // Initialize answer key with existing values or empty strings
            const currentBlanks = Array.isArray(question.answerKey?.blanks)
              ? question.answerKey.blanks
              : [];
            const newBlanks = Array(inputCount).fill("").map((_, idx) => currentBlanks[idx] || "");

            onChange({
              ...question,
              prompt: { ...question.prompt, text },
              answerKey: { blanks: newBlanks },
            });
          }}
          placeholder="Example:&#10;Hi, my name is [input] and I am [input] years old.&#10;Nice to [input] you!&#10;I am glad to [input] you here."
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
          rows={6}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use [input] where you want students to fill in answers. Each [input] will be a separate question.
        </p>
      </div>

      {/* Answer inputs for each blank */}
      {(question.prompt?.text || "").match(/\[input\]/gi)?.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Correct Answers (one per blank)
          </label>
          <div className="space-y-2">
            {Array.from({ length: (question.prompt?.text || "").match(/\[input\]/gi)?.length || 0 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Blank {idx + 1}:</span>
                <input
                  type="text"
                  value={Array.isArray(question.answerKey?.blanks)
                    ? question.answerKey.blanks[idx] || ""
                    : ""}
                  onChange={(e) => {
                    const blanks = [...(question.answerKey?.blanks || [])];
                    blanks[idx] = e.target.value;
                    onChange({
                      ...question,
                      answerKey: { blanks },
                    });
                  }}
                  placeholder={`Answer for blank ${idx + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total blanks: {(question.prompt?.text || "").match(/\[input\]/gi)?.length || 0}
          </p>
        </div>
      )}
    </div>
  );
}
