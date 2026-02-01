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

interface PartSection {
  id: string;
  title: string;
  image?: string | null;
  image2?: string | null; // Second image
  introduction?: string | null;
  questions: Question[];
}

interface IELTSListeningViewProps {
  partSections: PartSection[]; // All 4 Listening parts
  answers: Record<string, any>; // All answers across all parts
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
 * Audio plays continuously across all parts
 */
export const IELTSListeningView: React.FC<IELTSListeningViewProps> = ({
  partSections,
  answers,
  isLocked,
  renderQuestionComponent,
  onAnswerChange,
}) => {
  const [activePart, setActivePart] = useState(1);
  
  // Get current part section (1-indexed → 0-indexed)
  const currentPartSection = partSections[activePart - 1];
  if (!currentPartSection) {
    return <div className="text-center py-8 text-red-500">Part {activePart} not found</div>;
  }

  const currentPartQuestions = currentPartSection.questions || [];
  const currentPartTitle = IELTS_LISTENING_STRUCTURE.parts[activePart - 1]?.title || `Part ${activePart}`;
  const hasImage = !!currentPartSection.image;
  const hasImage2 = !!currentPartSection.image2;
  const hasIntroduction = !!currentPartSection.introduction;

  return (
    <div>
      {/* Part Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {partSections.map((partSection, idx) => {
            const partId = idx + 1;
            const partInfo = IELTS_LISTENING_STRUCTURE.parts[idx];
            const partQuestions = partSection.questions || [];
            const answeredCount = partQuestions.filter(q => 
              answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
            ).length;
            const isActive = activePart === partId;

            return (
              <button
                key={partSection.id}
                onClick={() => setActivePart(partId)}
                className={`
                  flex-shrink-0 px-4 py-3 rounded-t-lg border-b-2 transition-all
                  ${isActive 
                    ? "border-[#303380] bg-[#303380]/5 text-[#303380] font-semibold" 
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                <div className="text-sm">
                  <div className="font-medium">{partInfo?.title || `Part ${partId}`}</div>
                  <div className="text-xs mt-1 opacity-75">
                    Q{partInfo?.questionRange[0]}–{partInfo?.questionRange[1]}
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

      {/* Layout: Image Top, Questions Below */}
      <div className="space-y-6">
        {/* Images */}
        {(hasImage || hasImage2) && (
          <div className="flex gap-4 justify-center">
            {hasImage && (
              <div className="flex-1 max-w-2xl">
                <img
                  src={currentPartSection.image!}
                  alt={`${currentPartTitle} illustration`}
                  className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
                />
              </div>
            )}
            {hasImage2 && (
              <div className="flex-1 max-w-2xl">
                <img
                  src={currentPartSection.image2!}
                  alt={`${currentPartTitle} illustration 2`}
                  className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Questions */}
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

