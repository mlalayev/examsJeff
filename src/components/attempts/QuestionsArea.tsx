"use client";

import React, { useMemo } from "react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QuestionCard } from "./QuestionCard";
import { DndGapQuestion } from "./DndGapQuestion";
import { IELTSListeningView } from "./IELTSListeningView";

interface Question {
  id: string;
  qtype: string;
  prompt: any;
  options: any;
  answerKey: any;
  order: number;
  maxScore: number;
  image?: string | null; // Question-level image (for FILL_IN_BLANK)
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
  order: number;
  audio?: string | null;
  instruction?: string;
  passage?: string | null;
  image?: string | null; // Section image (for IELTS Listening parts)
  introduction?: string | null; // Section introduction (for IELTS Listening parts)
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
  examCategory?: string; // For IELTS audio restrictions
  userRole?: string; // For teacher preview
  allSections?: Section[]; // All sections for IELTS Listening multi-part view
  currentSectionIndex?: number; // Current section index in exam
  listeningPart?: number; // Current listening part (1-4)
  readingPart?: number; // Current reading part (1-3) for IELTS
  onListeningPartChange?: (part: number) => void; // Callback for part change
  onTimeExpired?: () => void; // Callback for timer expiration
  attemptId?: string; // For localStorage timer
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
  examCategory,
  userRole,
  allSections = [],
  currentSectionIndex = 0,
  listeningPart = 1,
  readingPart = 1,
  onListeningPartChange,
  onTimeExpired,
  attemptId,
}: QuestionsAreaProps) {
  const audioSource = section.audio || section.questions?.[0]?.prompt?.audio;
  const readingPassage =
    section.passage || section.questions?.[0]?.prompt?.passage;

  // Debug: Log IELTS Listening conditions
  if (section.type === "LISTENING" && examCategory === "IELTS") {
    console.log("🎧 IELTS Listening Debug:", {
      sectionType: section.type,
      examCategory,
      hasAudio: !!audioSource,
      audioSource,
      sectionAudio: section.audio,
      questionsCount: section.questions?.length,
    });
  }

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

        {/* IELTS Listening View */}
        {section.type === "LISTENING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSListeningView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={listeningPart}
              onPartChange={onListeningPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
            />
          </div>
        )}

        {/* Regular Audio Player for non-IELTS */}
        {audioSource && !(section.type === "LISTENING" && examCategory === "IELTS") && (
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
            <AudioPlayer src={audioSource} className="w-full" />
          </div>
        )}

        {/* Reading Passage */}
        {readingPassage && (
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
                {typeof readingPassage === 'object' && readingPassage !== null
                  ? (readingPassage as any)[`part${readingPart}`] || ""
                  : readingPassage}
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
            {(section.type === "LISTENING" && examCategory === "IELTS"
              ? section.questions
                  .filter((q) => {
                    // Filter questions by selected part (order is 0-based, so adjust ranges)
                    if (listeningPart === 1) return q.order >= 0 && q.order <= 9;
                    if (listeningPart === 2) return q.order >= 10 && q.order <= 19;
                    if (listeningPart === 3) return q.order >= 20 && q.order <= 29;
                    if (listeningPart === 4) return q.order >= 30 && q.order <= 39;
                    return true;
                  })
                  .sort((a, b) => a.order - b.order) // Sort by order
              : section.questions
            ).map((q, idx) => {
              const value = sectionAnswers[q.id];
              // For IELTS Listening, use the actual question order number
              let baseQuestionNum = 0;
              if (section.type === "LISTENING" && examCategory === "IELTS") {
                // Use actual order number directly (Q1 = 1, Q2 = 2, Q11 = 11, etc.)
                // For display, we show the actual order number
                baseQuestionNum = q.order;
              } else {
                baseQuestionNum = baseQuestionNumbers[idx] || 0;
              }

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
                  questionNumber={section.type === "LISTENING" && examCategory === "IELTS" ? baseQuestionNum : baseQuestionNum + 1}
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

