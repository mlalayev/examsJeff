"use client";

import React from "react";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface QuestionCardProps {
  question: Question;
  value: any;
  onChange: (v: any) => void;
  isLocked: boolean;
  questionNumber: number;
  renderQuestionComponent: (
    q: Question,
    value: any,
    onChange: (v: any) => void,
    readOnly: boolean,
    showWordBank?: boolean,
    externalDraggedOption?: string | null,
    onDropComplete?: () => void
  ) => React.ReactNode;
}

export const QuestionCard = React.memo(function QuestionCard({
  question,
  value,
  onChange,
  isLocked,
  questionNumber,
  renderQuestionComponent,
}: QuestionCardProps) {
  const isInlineLayout =
    question.qtype === "INLINE_SELECT" ||
    question.qtype === "MCQ_SINGLE" ||
    (question.qtype === "GAP" &&
      question.prompt?.text &&
      (question.prompt.text.includes("____") ||
        question.prompt.text.includes("___")));

  const isPrepositionDnD =
    (question.qtype === "GAP" || question.qtype === "DND_GAP") &&
    typeof question.prompt?.text === "string" &&
    question.prompt.text.includes("________");

  const isGapWithBlanks =
    question.qtype === "GAP" &&
    typeof question.prompt?.text === "string" &&
    (question.prompt.text.includes("____") ||
      question.prompt.text.includes("___"));

  return (
    <div
      className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
      style={{
        borderColor: "rgba(15, 17, 80, 0.63)",
      }}
    >
      <div className="p-6">
        {/* Transcript */}
        {question.prompt?.transcript && (
          <div
            className="mb-4 p-4 rounded-lg border"
            style={{
              backgroundColor: "rgba(48, 51, 128, 0.03)",
              borderColor: "rgba(48, 51, 128, 0.12)",
            }}
          >
            <p
              className="text-xs font-semibold mb-2 uppercase tracking-wide"
              style={{ color: "#303380" }}
            >
              🎧 Transcript
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {question.prompt.transcript}
            </p>
          </div>
        )}

        {/* Inline Layout */}
        {isInlineLayout ? (
          <>
            <div className="flex items-center gap-4">
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
                {question.qtype === "MCQ_SINGLE" ? (
                  <p
                    className="text-gray-800 text-base leading-relaxed font-normal"
                    style={{ lineHeight: "1.6", margin: 0 }}
                  >
                    {question.prompt?.text || "Question"}
                  </p>
                ) : (
                  renderQuestionComponent(question, value, onChange, isLocked)
                )}
              </div>
            </div>
            {question.qtype === "MCQ_SINGLE" && (
              <div className="mt-3">
                {renderQuestionComponent(question, value, onChange, isLocked)}
              </div>
            )}
          </>
        ) : (
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
            <div className="flex-1 pt-0.5">
              {!(isPrepositionDnD || isGapWithBlanks) && (
                <p
                  className="text-gray-800 text-base leading-relaxed font-normal mb-4"
                  style={{ lineHeight: "1.6" }}
                >
                  {question.prompt?.text || "Question"}
                </p>
              )}
              <div className="mt-4">
                {renderQuestionComponent(question, value, onChange, isLocked)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

