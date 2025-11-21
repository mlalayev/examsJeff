"use client";

import React, { useMemo } from "react";
import { WordBank } from "./WordBank";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface DndGapQuestionProps {
  question: Question;
  value: any;
  onChange: (v: any) => void;
  isLocked: boolean;
  baseQuestionNum: number;
  wordBankPosition: number;
  onWordBankPositionChange: (position: number) => void;
  draggedOption: string | null;
  onDragStart: (label: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDropComplete: () => void;
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

export const DndGapQuestion = React.memo(function DndGapQuestion({
  question,
  value,
  onChange,
  isLocked,
  baseQuestionNum,
  wordBankPosition,
  onWordBankPositionChange,
  draggedOption,
  onDragStart,
  onDragEnd,
  onDropComplete,
  renderQuestionComponent,
}: DndGapQuestionProps) {
  // Parse sentences
  const sentences = useMemo(() => {
    const text = question.prompt?.textWithBlanks;
    if (!text) return [];
    
    if (text.includes("\n")) {
      return text.split("\n").filter((line: string) => line.trim());
    } else if (text.includes("1.") && text.includes("2.")) {
      return text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
    } else {
      return text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
    }
  }, [question.prompt?.textWithBlanks]);

  // Generate word bank chips
  const chips = useMemo(() => {
    const rawOptions: string[] =
      question.answerKey?.blanks?.filter((b: string) => b && b.trim() !== "") ||
      question.options?.bank ||
      [];
    
    const chipList: Array<{ id: string; label: string }> = [];
    rawOptions.forEach((opt, optIdx) => {
      const m = opt.match(/^\s*(.+?)\s*\((\d+)x\)\s*$/i);
      if (m) {
        const label = m[1];
        const count = Math.max(1, parseInt(m[2], 10));
        for (let i = 0; i < count; i++) {
          chipList.push({
            id: `${label}-${optIdx}-${i}`,
            label,
          });
        }
      } else {
        chipList.push({
          id: `${opt}-${optIdx}-0`,
          label: opt,
        });
      }
    });

    // Shuffle chips deterministically
    for (let i = chipList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = chipList[i];
      chipList[i] = chipList[j];
      chipList[j] = t;
    }

    return chipList;
  }, [question.answerKey?.blanks, question.options?.bank]);

  // Check if option is used
  const isOptionUsed = (label: string) => {
    const currentAnswers = value || {};
    return Object.values(currentAnswers).some((sentenceAnswers: any) => {
      if (Array.isArray(sentenceAnswers)) {
        return sentenceAnswers.includes(label);
      }
      return false;
    });
  };

  return (
    <div className="space-y-5">
      {sentences.map((sentence: string, sentenceIdx: number) => {
        const questionNum = baseQuestionNum + sentenceIdx + 1;
        const sentenceQuestion = {
          ...question,
          prompt: {
            ...question.prompt,
            textWithBlanks: sentence,
          },
        };

        const sentenceValue = (() => {
          const currentValue = value || {};
          const sentenceAnswers = currentValue[sentenceIdx.toString()];
          return sentenceAnswers ? { "0": sentenceAnswers } : {};
        })();

        const sentenceOnChange = (newValue: any) => {
          const currentValue = value || {};
          const updatedValue = { ...currentValue };
          if (newValue && newValue["0"]) {
            updatedValue[sentenceIdx.toString()] = newValue["0"];
          } else {
            delete updatedValue[sentenceIdx.toString()];
          }
          onChange(updatedValue);
        };

        return (
          <React.Fragment key={`${question.id}-${sentenceIdx}`}>
            <div
              className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: "rgba(15, 17, 80, 0.63)",
              }}
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                    style={{
                      backgroundColor: "#303380",
                      color: "white",
                    }}
                  >
                    {questionNum}
                  </div>
                  <div className="flex-1">
                    {renderQuestionComponent(
                      sentenceQuestion,
                      sentenceValue,
                      sentenceOnChange,
                      isLocked,
                      false,
                      draggedOption,
                      onDropComplete
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Word Bank */}
            {sentenceIdx === wordBankPosition && (
              <WordBank
                chips={chips}
                isOptionUsed={isOptionUsed}
                isLocked={isLocked}
                wordBankPosition={wordBankPosition}
                maxPosition={sentences.length - 1}
                onMoveUp={() => {
                  if (wordBankPosition > 0) {
                    onWordBankPositionChange(wordBankPosition - 1);
                  }
                }}
                onMoveDown={() => {
                  if (wordBankPosition < sentences.length - 1) {
                    onWordBankPositionChange(wordBankPosition + 1);
                  }
                }}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

