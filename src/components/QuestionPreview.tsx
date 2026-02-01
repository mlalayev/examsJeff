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
        {/* Question Text (skip for FILL_IN_BLANK - it has custom layout) */}
        {question.prompt?.text && question.qtype !== "FILL_IN_BLANK" && (
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

        {/* Fill in the Blank (IELTS) */}
        {question.qtype === "FILL_IN_BLANK" && (
          <div className="space-y-4">
            {(() => {
              const text = question.prompt?.text || "";
              const questionTitle = question.prompt?.title || "";
              const imageUrl = question.image || question.prompt?.imageUrl;
              
              const [titlePart = "", itemsPart = ""] = text.split("---").map((s: string) => s.trim());
              
              // Use explicit title if provided, otherwise use titlePart from text
              const displayTitle = questionTitle || titlePart;
              
              // If we have explicit title, use full text as items; otherwise use itemsPart
              const itemsText = questionTitle ? text : itemsPart;
              const items = itemsText.split("\n").filter((line: string) => line.trim());

              return (
                <>
                  {/* Question number + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                      style={{
                        backgroundColor: "#303380",
                        color: "white",
                      }}
                    >
                      1
                    </div>
                    {displayTitle && (
                      <div className="flex-1 pt-2">
                        <div className="text-base font-medium text-gray-900">
                          <FormattedText text={displayTitle} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image (if provided) */}
                  {imageUrl && (
                    <div className="w-full mb-6 pl-14">
                      <img
                        src={imageUrl}
                        alt="Question illustration"
                        className="w-full max-w-3xl h-auto rounded-lg border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-4 pl-14">
                    {items.map((item: string, idx: number) => {
                      const hasBlank = item.includes("[input]");
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="text-gray-800">
                            <FormattedText text={item} />
                          </div>
                          {hasBlank && (
                            <input
                              type="text"
                              disabled
                              placeholder={`Answer ${idx + 1}`}
                              className="px-3 py-2 border-2 rounded-md text-base bg-gray-50 cursor-not-allowed"
                              style={{
                                width: "240px",
                                borderColor: "rgba(48, 51, 128, 0.2)",
                                color: "#9CA3AF",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Note:</strong> Answers are not case-sensitive
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2 italic">
        * This is how the question will appear to students during the exam
      </p>
    </div>
  );
}

