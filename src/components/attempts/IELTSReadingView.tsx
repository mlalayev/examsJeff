"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options?: any;
  image?: string;
  order: number;
}

interface PassageSection {
  id: string;
  title: string;
  passage: string;
  introduction?: string;
  questions: Question[];
}

interface IELTSReadingViewProps {
  partSections: PassageSection[]; // 3 passages
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  examCategory?: string;
  renderQuestionComponent?: (
    q: Question,
    value: any,
    onChange: (v: any) => void,
    readOnly: boolean
  ) => React.ReactNode;
}

export default function IELTSReadingView({
  partSections,
  answers,
  onAnswerChange,
  examCategory = "IELTS",
  renderQuestionComponent,
}: IELTSReadingViewProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!partSections || partSections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <p>No reading passages available</p>
      </div>
    );
  }

  const activePassage = partSections[activeTab];

  return (
    <div className="space-y-4">
      {/* Tab Navigation - 3 Passages */}
      <div className="flex gap-2 border-b border-gray-200">
        {partSections.map((passage, index) => (
          <button
            key={passage.id}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === index
                ? "text-[#303380] border-b-2 border-[#303380]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {passage.title}
            <span className="ml-2 text-xs text-gray-400">
              ({passage.questions.length} questions)
            </span>
          </button>
        ))}
      </div>

      {/* Passage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Passage Text */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-[#303380] mb-4">
            {activePassage.title}
          </h3>

          {activePassage.introduction && (
            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 text-sm text-gray-700 italic">
              {activePassage.introduction}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
            {activePassage.passage}
          </div>
        </div>

        {/* Right: Questions */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {activePassage.questions.length > 0 ? (
            activePassage.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
              >
                {renderQuestionComponent ? (
                  renderQuestionComponent(q, answers[q.id], (answer: any) => onAnswerChange(q.id, answer), false)
                ) : (
                  <div className="text-gray-400">Question rendering not available</div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-12">
              <BookOpen className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              <p>No questions for this passage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

