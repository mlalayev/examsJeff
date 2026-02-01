"use client";

import React, { useMemo } from "react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import IELTSAudioPlayer from "@/components/audio/IELTSAudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QuestionCard } from "./QuestionCard";
import { DndGapQuestion } from "./DndGapQuestion";
import { IELTSListeningView } from "./IELTSListeningView";
import IELTSReadingView from "./IELTSReadingView";

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
}: QuestionsAreaProps) {
  const audioSource = section.audio || section.questions?.[0]?.prompt?.audio;
  const readingPassage =
    section.passage || section.questions?.[0]?.prompt?.passage;

  const sectionAnswers = answers[section.id] || {};

  // For IELTS Listening: Check if this is a Listening Part section
  const isIELTSListeningPart = examCategory === "IELTS" && section.type === "LISTENING";
  
  // For IELTS Reading: Check if this is a Reading Passage section
  const isIELTSReadingPassage = examCategory === "IELTS" && section.type === "READING";
  
  // Find all IELTS Listening parts (4 consecutive sections)
  const ieltsListeningParts = isIELTSListeningPart 
    ? allSections
        .filter(s => s.type === "LISTENING")
        .filter(s => s.questions && s.questions.length > 0) // Only sections with questions
        .slice(0, 4)
    : [];

  // Find all IELTS Reading passages (3 passages)
  const ieltsReadingPassages = isIELTSReadingPassage
    ? allSections
        .filter(s => s.type === "READING")
        .filter(s => s.questions && s.questions.length > 0) // Only passages with questions
        .slice(0, 3)
    : [];
  
  // If current section is empty (parent section), show first subsection's content
  const isEmptyParentSection = (section.questions?.length || 0) === 0;
  const shouldShowIELTSView = isIELTSListeningPart && ieltsListeningParts.length > 0;
  const shouldShowReadingView = isIELTSReadingPassage && ieltsReadingPassages.length > 0;
  
  // Is this the first Listening part? (only first part shows audio player)
  const isFirstListeningPart = shouldShowIELTSView && ieltsListeningParts[0].id === section.id;

  // Is this the first Reading passage?
  const isFirstReadingPassage = shouldShowReadingView && ieltsReadingPassages[0].id === section.id;
  
  // Collect all answers from all 4 Listening parts
  const allListeningAnswers = isIELTSListeningPart
    ? ieltsListeningParts.reduce((acc, partSection) => {
        const partAnswers = answers[partSection.id] || {};
        return { ...acc, ...partAnswers };
      }, {})
    : sectionAnswers;

  // Collect all answers from all 3 Reading passages
  const allReadingAnswers = isIELTSReadingPassage
    ? ieltsReadingPassages.reduce((acc, passageSection) => {
        const passageAnswers = answers[passageSection.id] || {};
        return { ...acc, ...passageAnswers };
      }, {})
    : sectionAnswers;

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

        {/* Audio Player - Only show once for first IELTS Listening part */}
        {audioSource && (!isIELTSListeningPart || isFirstListeningPart) && (
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
                {isIELTSListeningPart 
                  ? "The audio plays continuously. Navigate between parts using the tabs below."
                  : "Listen to the audio and answer the questions below"
                }
              </p>
            </div>
            {/* Use IELTS-restricted player for IELTS Listening sections (student mode) */}
            {examCategory === "IELTS" && section.type === "LISTENING" && userRole !== "TEACHER" && userRole !== "ADMIN" ? (
              <IELTSAudioPlayer 
                src={audioSource} 
                className="w-full"
                allowFullControls={false}
              />
            ) : (
              <AudioPlayer src={audioSource} className="w-full" />
            )}
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
                {readingPassage}
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
        ) : examCategory === "IELTS" && section.type === "LISTENING" ? (
          // IELTS Listening: Always show all 4 parts in one view
          shouldShowIELTSView ? (
            <IELTSListeningView
              partSections={ieltsListeningParts.map(s => ({
                id: s.id,
                title: s.title,
                image: s.image,
                introduction: s.introduction || s.instruction, // Use introduction field, fallback to instruction
                questions: s.questions,
              }))}
              answers={allListeningAnswers}
              isLocked={isLocked}
              renderQuestionComponent={(q, value, onChange, readOnly) => 
                renderQuestionComponent(q, value, onChange, readOnly, false, null, undefined)
              }
              onAnswerChange={onAnswerChange}
            />
          ) : (
            // If no subsections found
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg font-medium">No listening parts found</p>
                <p className="text-sm mt-2">Please contact your instructor</p>
              </div>
            </div>
          )
        ) : examCategory === "IELTS" && section.type === "READING" ? (
          // IELTS Reading: Always show all 3 passages in one view
          shouldShowReadingView ? (
            <IELTSReadingView
              partSections={ieltsReadingPassages.map(s => ({
                id: s.id,
                title: s.title,
                passage: s.passage || "",
                introduction: s.introduction || s.instruction,
                questions: s.questions,
              }))}
              answers={allReadingAnswers}
              onAnswerChange={onAnswerChange}
              examCategory={examCategory}
              renderQuestionComponent={(q, value, onChange, readOnly) =>
                renderQuestionComponent(q, value, onChange, readOnly, false, null, undefined)
              }
            />
          ) : (
            // If no passages found
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg font-medium">No reading passages found</p>
                <p className="text-sm mt-2">Please contact your instructor</p>
              </div>
            </div>
          )
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

