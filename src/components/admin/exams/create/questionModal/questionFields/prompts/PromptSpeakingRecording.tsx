"use client";

import { Question } from "../../../types";

interface PromptSpeakingRecordingProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptSpeakingRecording({ question, onChange }: PromptSpeakingRecordingProps) {
  return (
    <div className="space-y-3">
      {/* Speaking Part Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Speaking Part *
        </label>
        <select
          value={question.prompt?.part || 1}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: { ...question.prompt, part: parseInt(e.target.value) },
            });
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        >
          <option value={1}>Part 1 (3s reading + 30s recording)</option>
          <option value={2}>Part 2 (1min prep + 3s reading + 2min recording)</option>
          <option value={3}>Part 3 (3s reading + 1min recording)</option>
        </select>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Question Text *
        </label>
        <textarea
          value={question.prompt?.text || ""}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: { ...question.prompt, text: e.target.value },
            });
          }}
          placeholder="Enter the speaking question (e.g., 'What is your name?', 'Describe a place you like to visit.', etc.)"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          rows={4}
        />
      </div>

      <div className="pt-3 border-t border-gray-200 bg-blue-50 p-3 rounded-md">
        <p className="text-xs text-blue-800 space-y-1">
          <strong>Note:</strong>
          <br />
          • Students get 3 seconds to read the question
          <br />
          {question.prompt?.part === 2 && "• Part 2: 1 minute preparation → 3 seconds reading → 2 minutes recording"}
          {question.prompt?.part === 1 && "• Part 1: 3 seconds reading → 30 seconds recording"}
          {question.prompt?.part === 3 && "• Part 3: 3 seconds reading → 1 minute recording"}
          <br />
          • Recording starts and stops automatically (students cannot control it)
        </p>
      </div>
    </div>
  );
}
