"use client";

import React, { useState } from "react";
import { PenTool, Check, FileText } from "lucide-react";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface IELTSWritingViewProps {
  section: {
    id: string;
    type: string;
    title: string;
    questions: Question[];
  };
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

export function IELTSWritingView({
  section,
  answers,
  onAnswerChange,
}: IELTSWritingViewProps) {
  // For Writing, show all questions at once (since there's usually just 1 essay task per section)
  const wordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Determine minimum words based on section title
  const minWords = section.title.includes("Task 1") ? 150 : 250;
  const taskNumber = section.title.includes("Task 1") ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <PenTool className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-gray-900">{section.title}</span>
        </div>
        <p className="text-sm text-gray-600">
          Write at least {minWords} words for this task.
        </p>
      </div>

      {/* Questions */}
      {section.questions.map((question, idx) => {
        const answer = answers[question.id] || "";
        const count = wordCount(answer);
        const isComplete = count >= minWords;

        return (
          <div key={question.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 space-y-4">
            {/* Question Prompt */}
            {question.prompt?.image && (
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                <img src={question.prompt.image} alt="Question" className="w-full h-auto" />
              </div>
            )}
            
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Task {taskNumber}:</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {question.prompt?.text || "Write your essay"}
                  </p>
                </div>
              </div>
            </div>

            {/* Word Count */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Word Count: <span className={count < minWords ? "text-orange-600" : "text-green-600"}>{count}</span> / {minWords} minimum
              </span>
              {isComplete && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs font-medium">Target reached!</span>
                </div>
              )}
            </div>

            {/* Text Area */}
            <textarea
              value={answer}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder={`Write your essay here (minimum ${minWords} words)...`}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base leading-relaxed focus:outline-none focus:border-orange-400 min-h-[400px] resize-y"
            />
          </div>
        );
      })}
    </div>
  );
}

