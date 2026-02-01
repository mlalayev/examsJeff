"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options?: any;
  answerKey: any;
  maxScore: number;
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
      <div className="flex gap-2 border-b border-gray-200 bg-white px-4">
        {partSections.map((passage, index) => {
          // Calculate question range for this passage
          const questionStart = index === 0 ? 1 : (index === 1 ? 14 : 27);
          const questionEnd = index === 0 ? 13 : (index === 1 ? 26 : 40);
          
          // Count answered questions for this passage
          const answeredCount = passage.questions.filter(q => {
            const answer = answers[q.id];
            if (answer === null || answer === undefined || answer === "") return false;
            if (typeof answer === "object") {
              return Object.keys(answer).length > 0 && Object.values(answer).some(v => v !== "" && v !== null && v !== undefined);
            }
            return true;
          }).length;
          const totalCount = passage.questions.length;
          
          return (
            <button
              key={passage.id}
              onClick={() => setActiveTab(index)}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === index
                  ? "text-[#303380] border-b-3 border-[#303380] bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              style={activeTab === index ? { borderBottomWidth: "3px" } : {}}
            >
              Part {index + 1}
              <div className="text-xs text-gray-500 font-normal mt-1">
                Q{questionStart}-{questionEnd}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: activeTab === index ? "#303380" : "#6B7280" }}>
                {answeredCount}/{totalCount}
              </div>
            </button>
          );
        })}
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
            activePassage.questions.map((q, idx) => {
              // Calculate question number (Passage 1: Q1-13, Passage 2: Q14-26, Passage 3: Q27-40)
              const baseQuestionNumber = activeTab * 13 + 1; // Approximate, adjust as needed
              const questionNumber = baseQuestionNumber + idx;
              
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
                  style={{ borderColor: "rgba(15, 17, 80, 0.63)" }}
                >
                  <div className="p-6">
                    {/* Question Header with Number and Prompt */}
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                        style={{
                          backgroundColor: "#303380",
                          color: "white",
                        }}
                      >
                        {questionNumber}
                      </div>
                      <div className="flex-1">
                        {/* Show prompt text for MCQ questions */}
                        {(q.qtype === "MCQ_SINGLE" || q.qtype === "MCQ_MULTI") && q.prompt?.text && (
                          <p className="text-gray-800 text-base leading-relaxed font-normal mb-4" style={{ lineHeight: "1.6" }}>
                            {q.prompt.text}
                          </p>
                        )}
                        
                        {/* Render question component */}
                        <div>
                          {renderQuestionComponent ? (
                            renderQuestionComponent(q, answers[q.id], (answer: any) => onAnswerChange(q.id, answer), false)
                          ) : (
                            <div className="text-gray-400">Question rendering not available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
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

