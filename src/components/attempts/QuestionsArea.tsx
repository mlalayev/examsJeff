"use client";

import React, { useMemo } from "react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QuestionCard } from "./QuestionCard";
import { DndGapQuestion } from "./DndGapQuestion";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  order: number;
  audio?: string | null;
}

interface QuestionsAreaProps {
  section: Section;
  answers: Record<string, any>; // Key is section.id now
  isLocked: boolean;
  wordBankPositions: Record<string, number>;
  draggedOptions: Record<string, string | null>;
  onAnswerChange: (questionId: string, value: any) => void;
  onWordBankPositionChange: (questionId: string, position: number) => void;
  onDragStart: (questionId: string, label: string, e: React.DragEvent) => void;
  onDragEnd: (questionId: string) => void;
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

export const QuestionsArea = React.memo(function QuestionsArea({
  section,
  answers,
  isLocked,
  wordBankPositions,
  draggedOptions,
  onAnswerChange,
  onWordBankPositionChange,
  onDragStart,
  onDragEnd,
  renderQuestionComponent,
}: QuestionsAreaProps) {
  const sectionAnswers = answers[section.id] || {};

  // Calculate base question numbers for DND_GAP questions
  const baseQuestionNumbers = useMemo(() => {
    const bases: Record<number, number> = {};
    let currentBase = 0;
    
    section.questions.forEach((q, idx) => {
      bases[idx] = currentBase;
      if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
        const text = q.prompt.textWithBlanks;
        let sentences: string[] = [];
        if (text.includes("\n")) {
          sentences = text.split("\n").filter((line: string) => line.trim());
        } else if (text.includes("1.") && text.includes("2.")) {
          sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
        } else {
          sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
        }
        currentBase += sentences.length;
      } else {
        currentBase += 1;
      }
    });
    
    return bases;
  }, [section.questions]);

  const isGroupedDnd =
    section.questions?.[0]?.qtype === "DND_GAP" &&
    (section.title?.toLowerCase().includes("preposition") ||
      section.title?.toLowerCase().includes("time expression") ||
      section.title?.toLowerCase().includes("short form"));

  return (
    <div className="flex-1">
      <div className="bg-white rounded-xl mt-1 shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
        </div>

        {/* Audio Player */}
        {section.audio && (
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#303380" }}
              >
                🎧 Listening Audio
              </h3>
              <p
                className="text-sm"
                style={{ color: "rgba(48, 51, 128, 0.7)" }}
              >
                Listen to the audio and answer the questions below
              </p>
            </div>
            <AudioPlayer src={section.audio} className="w-full" />
          </div>
        )}

        {/* Reading Passage */}
        {section.questions?.[0]?.prompt?.passage && (
          <div
            className="mb-6 p-6 rounded-lg"
            style={{
              backgroundColor: "rgba(48, 51, 128, 0.05)",
              borderColor: "rgba(48, 51, 128, 0.15)",
              border: "1px solid",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#303380" }}
            >
              Reading Passage
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {section.questions[0].prompt.passage}
              </p>
            </div>
          </div>
        )}

        {/* Grouped DnD */}
        {isGroupedDnd ? (
          <div
            className="bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: "rgba(15, 17, 80, 0.63)",
            }}
          >
            <div className="p-6">
              <QDndGroup
                questions={section.questions}
                values={sectionAnswers}
                onChange={(qid, v) => onAnswerChange(qid, v)}
                readOnly={isLocked}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {section.questions.map((q, idx) => {
              const value = sectionAnswers[q.id];
              const baseQuestionNum = baseQuestionNumbers[idx] || 0;

              // DND_GAP special handling
              if (q.qtype === "DND_GAP" && q.prompt?.textWithBlanks) {
                const wordBankPosition =
                  wordBankPositions[q.id] !== undefined
                    ? wordBankPositions[q.id]
                    : (() => {
                        const text = q.prompt.textWithBlanks;
                        let sentences: string[] = [];
                        if (text.includes("\n")) {
                          sentences = text.split("\n").filter((line: string) => line.trim());
                        } else if (text.includes("1.") && text.includes("2.")) {
                          sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
                        } else {
                          sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
                        }
                        return sentences.length - 1;
                      })();

                return (
                  <DndGapQuestion
                    key={q.id}
                    question={q}
                    value={value}
                    onChange={(v) => onAnswerChange(q.id, v)}
                    isLocked={isLocked}
                    baseQuestionNum={baseQuestionNum}
                    wordBankPosition={wordBankPosition}
                    onWordBankPositionChange={(pos) =>
                      onWordBankPositionChange(q.id, pos)
                    }
                    draggedOption={draggedOptions[q.id] || null}
                    onDragStart={(label, e) => onDragStart(q.id, label, e)}
                    onDragEnd={() => onDragEnd(q.id)}
                    onDropComplete={() => onDragEnd(q.id)}
                    renderQuestionComponent={renderQuestionComponent}
                  />
                );
              }

              // Regular question
              return (
                <QuestionCard
                  key={q.id}
                  question={q}
                  value={value}
                  onChange={(v) => onAnswerChange(q.id, v)}
                  isLocked={isLocked}
                  questionNumber={baseQuestionNum + 1}
                  renderQuestionComponent={renderQuestionComponent}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

