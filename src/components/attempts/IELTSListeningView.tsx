"use client";

import React, { useState } from "react";
import { IELTS_LISTENING_STRUCTURE, groupIELTSListeningQuestions } from "@/lib/ielts-listening-helper";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface IELTSListeningViewProps {
  questions: Question[];
  answers: Record<string, any>;
  isLocked: boolean;
  renderQuestionComponent: (
    q: Question,
    value: any,
    onChange: (v: any) => void,
    readOnly: boolean
  ) => React.ReactNode;
  onAnswerChange: (questionId: string, value: any) => void;
}

/**
 * IELTS Listening View - Shows 4 parts with tab navigation
 */
export const IELTSListeningView: React.FC<IELTSListeningViewProps> = ({
  questions,
  answers,
  isLocked,
  renderQuestionComponent,
  onAnswerChange,
}) => {
  const [activePart, setActivePart] = useState(1);
  
  // Group questions by parts
  const groupedQuestions = groupIELTSListeningQuestions(questions);
  const currentPartQuestions = groupedQuestions[activePart] || [];

  return (
    <div>
      {/* Part Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {IELTS_LISTENING_STRUCTURE.parts.map((part) => {
            const partQuestions = groupedQuestions[part.id] || [];
            const answeredCount = partQuestions.filter(q => 
              answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
            ).length;
            const isActive = activePart === part.id;

            return (
              <button
                key={part.id}
                onClick={() => setActivePart(part.id)}
                className={`
                  flex-shrink-0 px-4 py-3 rounded-t-lg border-b-2 transition-all
                  ${isActive 
                    ? "border-[#303380] bg-[#303380]/5 text-[#303380] font-semibold" 
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                <div className="text-sm">
                  <div className="font-medium">{part.title}</div>
                  <div className="text-xs mt-1 opacity-75">
                    Q{part.questionRange[0]}–{part.questionRange[1]}
                  </div>
                  <div className="text-xs mt-1">
                    {answeredCount}/{partQuestions.length}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Part Description */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          {IELTS_LISTENING_STRUCTURE.parts[activePart - 1].title}
        </h3>
        <p className="text-xs text-blue-700">
          {IELTS_LISTENING_STRUCTURE.parts[activePart - 1].description}
        </p>
      </div>

      {/* Questions for current part */}
      <div className="space-y-6">
        {currentPartQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions in this part</p>
          </div>
        ) : (
          currentPartQuestions.map((q) => {
            const value = answers[q.id];
            const onChange = (newValue: any) => onAnswerChange(q.id, newValue);
            
            return (
              <div key={q.id}>
                {renderQuestionComponent(q, value, onChange, isLocked)}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setActivePart(Math.max(1, activePart - 1))}
          disabled={activePart === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous Part
        </button>
        <button
          onClick={() => setActivePart(Math.min(4, activePart + 1))}
          disabled={activePart === 4}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#303380" }}
        >
          Next Part →
        </button>
      </div>
    </div>
  );
};

