"use client";

import React from "react";
import FormattedText from "./FormattedText";

interface QuestionPreviewProps {
  question: {
    qtype: string;
    prompt?: {
      text?: string;
      [key: string]: any;
    };
    options?: {
      choices?: string[];
      [key: string]: any;
    };
  };
}

export default function QuestionPreview({ question }: QuestionPreviewProps) {
  if (!question) return null;

  const hasContent = question.prompt?.text || (question.options?.choices && question.options.choices.length > 0);
  
  if (!hasContent) return null;

  return (
    <div className="border-t-2 border-gray-300 pt-4 mt-6">
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Preview: How students will see this
        </h4>
      </div>
      
      <div className="bg-white rounded-xl border shadow-sm p-6" style={{ borderColor: "rgba(15, 17, 80, 0.63)" }}>
        {/* Question Text */}
        {question.prompt?.text && (
          <div className="mb-4">
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                style={{
                  backgroundColor: "#303380",
                  color: "white",
                }}
              >
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-gray-800 text-base leading-relaxed font-normal" style={{ lineHeight: "1.6" }}>
                  <FormattedText text={question.prompt.text} />
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Options */}
        {(question.qtype === "MCQ_SINGLE" || question.qtype === "MCQ_MULTI" || question.qtype === "INLINE_SELECT") &&
          question.options?.choices &&
          question.options.choices.length > 0 && (
            <div className="space-y-3 mt-4">
              {question.options.choices.map((choice: string, idx: number) => {
                const choiceImage = question.options?.choiceImages?.[idx];
                return (
                  <div key={idx}>
                    <div
                      className="w-full text-left flex items-center space-x-4 px-5 py-3.5 rounded-lg border transition-all shadow-sm bg-white hover:shadow"
                      style={{
                        borderColor: "rgba(48, 51, 128, 0.15)",
                        color: "#374151",
                      }}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 ${
                          question.qtype === "MCQ_MULTI" ? "rounded" : "rounded-full"
                        } border-2 flex items-center justify-center transition-all border-gray-300`}
                      >
                        {question.qtype === "MCQ_MULTI" && <div className="w-2.5 h-2.5 rounded-full"></div>}
                      </div>
                      <div className="flex-1">
                        <span className="text-base font-medium">
                          {choice ? <FormattedText text={choice} /> : <span className="text-gray-400 italic">Option {idx + 1}</span>}
                        </span>
                        {choiceImage && (
                          <div className="mt-2">
                            <img
                              src={choiceImage}
                              alt={`Option ${idx + 1}`}
                              className="max-h-32 w-auto rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        {/* True/False */}
        {question.qtype === "TF" && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-4">
              {["True", "False"].map((label) => (
                <div
                  key={label}
                  className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border transition-all shadow-sm bg-white"
                  style={{
                    borderColor: "rgba(48, 51, 128, 0.15)",
                    color: "#374151",
                  }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all border-gray-300"></div>
                  <span className="text-base font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Text / Short Text */}
        {(question.qtype === "SHORT_TEXT" || question.qtype === "GAP" || question.qtype === "ESSAY") && (
          <div className="mt-4">
            <input
              type="text"
              disabled
              placeholder="Student answer will appear here..."
              className="w-full px-4 py-3.5 border rounded-lg text-base font-medium bg-gray-50 cursor-not-allowed"
              style={{
                borderColor: "rgba(48, 51, 128, 0.2)",
                color: "#9CA3AF",
              }}
            />
          </div>
        )}

        {/* Speaking Recording */}
        {question.qtype === "SPEAKING_RECORDING" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <p className="text-sm font-medium text-blue-900">
                  {question.prompt?.part === 1 && "Part 1 - 3s reading + 30s recording"}
                  {question.prompt?.part === 2 && "Part 2 - 1min prep + 3s reading + 2min recording"}
                  {question.prompt?.part === 3 && "Part 3 - 3s reading + 1min recording"}
                </p>
              </div>
              <p className="text-xs text-blue-700">
                Recording starts and stops automatically. Students cannot pause or stop manually.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <button
                disabled
                className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                Start (Preview)
              </button>
            </div>
          </div>
        )}

        {/* Fill in the Blank */}
        {question.qtype === "FILL_IN_BLANK" && (
          <div className="mt-4 space-y-3">
            {question.prompt?.instructions && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-3">
                <p className="text-sm font-medium text-blue-900">
                  <FormattedText text={question.prompt.instructions} />
                </p>
              </div>
            )}
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <div className="text-base leading-relaxed text-gray-800">
                {(question.prompt?.text || "").split(/(\[input\])/gi).map((part: string, idx: number) => {
                  if (part.toLowerCase() === '[input]') {
                    return (
                      <input
                        key={idx}
                        type="text"
                        disabled
                        className="inline-block mx-1 px-3 py-1 border-b-2 border-blue-400 bg-blue-50/50 text-gray-900 text-base cursor-not-allowed min-w-[120px]"
                        placeholder="___"
                      />
                    );
                  }
                  return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
                })}
              </div>
            </div>
          </div>
        )}

      </div>

      <p className="text-xs text-gray-500 mt-2 italic">
        * This is how the question will appear to students during the exam
      </p>
    </div>
  );
}

