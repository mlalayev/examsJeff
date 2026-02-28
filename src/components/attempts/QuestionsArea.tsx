"use client";

import React, { useMemo } from "react";
import AudioPlayer from "@/components/audio/AudioPlayer";
import QDndGroup from "@/components/questions/QDndGroup";
import { QuestionCard } from "./QuestionCard";
import { DndGapQuestion } from "./DndGapQuestion";
import { IELTSListeningView } from "./IELTSListeningView";
import { IELTSReadingView } from "./IELTSReadingView";
import { IELTSWritingView } from "./IELTSWritingView";
import { IELTSSpeakingView } from "./IELTSSpeakingView";

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
  writingPart?: number; // Current writing part (1-2) for IELTS
  speakingPart?: number; // Current speaking part (1-3) for IELTS
  onListeningPartChange?: (part: number) => void; // Callback for part change
  onReadingPartChange?: (part: number) => void; // Callback for reading part change
  onWritingPartChange?: (part: number) => void; // Callback for writing part change
  onSpeakingPartChange?: (part: number) => void; // Callback for speaking part change
  onTimeExpired?: () => void; // Callback for timer expiration
  attemptId?: string; // For localStorage timer
  isPassageOpen?: boolean; // Whether the reading passage panel is open
  onPassageToggle?: () => void; // Toggle reading passage panel
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
  writingPart = 1,
  speakingPart = 1,
  onListeningPartChange,
  onReadingPartChange,
  onWritingPartChange,
  onSpeakingPartChange,
  onTimeExpired,
  attemptId,
  isPassageOpen,
  onPassageToggle,
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
          {/* IELTS Reading Passage Toggle */}
          {section.type === "READING" && examCategory === "IELTS" && onPassageToggle && (
            <button
              onClick={onPassageToggle}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={isPassageOpen ? {
                backgroundColor: "#303380",
                color: "white",
                boxShadow: "0 2px 8px rgba(48, 51, 128, 0.3)",
              } : {
                backgroundColor: "rgba(48, 51, 128, 0.08)",
                color: "#303380",
                border: "1px solid rgba(48, 51, 128, 0.2)",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {isPassageOpen ? "Hide Passage" : "Show Passage"}
            </button>
          )}
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

        {/* IELTS Reading View */}
        {section.type === "READING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSReadingView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={readingPart}
              onPartChange={onReadingPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
            />
          </div>
        )}

        {/* IELTS Writing View */}
        {section.type === "WRITING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSWritingView
              section={section}
              answers={answers}
              currentPart={writingPart}
              onPartChange={onWritingPartChange}
              onTimeExpired={onTimeExpired}
              attemptId={attemptId}
              allSections={allSections}
            />
          </div>
        )}

        {/* IELTS Speaking View */}
        {section.type === "SPEAKING" && examCategory === "IELTS" && (
          <div className="mb-8">
            <IELTSSpeakingView
              section={section}
              answers={answers[section.id] || {}}
              currentPart={speakingPart}
              onPartChange={onSpeakingPartChange}
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
            {(() => {
              // Filter questions based on section type and part
              let filteredQuestions = section.questions;
              
              if (section.type === "LISTENING" && examCategory === "IELTS") {
                // Filter questions by selected part (order is 0-based)
                filteredQuestions = section.questions.filter((q) => {
                  if (listeningPart === 1) return q.order >= 0 && q.order <= 9;
                  if (listeningPart === 2) return q.order >= 10 && q.order <= 19;
                  if (listeningPart === 3) return q.order >= 20 && q.order <= 29;
                  if (listeningPart === 4) return q.order >= 30 && q.order <= 39;
                  return true;
                }).sort((a, b) => a.order - b.order);
              } else if (section.type === "READING" && examCategory === "IELTS") {
                // Filter questions by selected reading part: Part 1 (14), Part 2 (13), Part 3 (13)
                filteredQuestions = section.questions.filter((q) => {
                  if (readingPart === 1) return q.order >= 0 && q.order < 14; // Q1-14 (order 0-13)
                  if (readingPart === 2) return q.order >= 14 && q.order < 27; // Q15-27 (order 14-26)
                  if (readingPart === 3) return q.order >= 27; // Q28-40 (order 27-39)
                  return true;
                }).sort((a, b) => a.order - b.order);
              } else if (section.type === "WRITING" && examCategory === "IELTS") {
                // For Writing, if section has multiple questions, filter by order
                // Task 1 is typically order 0, Task 2 is order 1
                if (section.questions.length > 1) {
                  filteredQuestions = section.questions.filter((q) => {
                    if (writingPart === 1) return q.order === 0;
                    if (writingPart === 2) return q.order === 1;
                    return true;
                  });
                } else {
                  // Single question section - show all (panel will show progress)
                  filteredQuestions = section.questions;
                }
              } else if (section.type === "SPEAKING" && examCategory === "IELTS") {
                // For Speaking, filter by prompt.part or prompt text containing "Part X"
                filteredQuestions = section.questions.filter((q) => {
                  const part = q.prompt?.part;
                  if (part === speakingPart) return true;
                  
                  // Fall back to checking prompt text
                  const promptText = q.prompt?.text?.toLowerCase() || "";
                  if (speakingPart === 1 && (promptText.includes("part 1") || promptText.includes("part1"))) return true;
                  if (speakingPart === 2 && (promptText.includes("part 2") || promptText.includes("part2"))) return true;
                  if (speakingPart === 3 && (promptText.includes("part 3") || promptText.includes("part3"))) return true;
                  
                  // If no part specified, distribute by order
                  if (!part && !promptText.includes("part")) {
                    const totalQuestions = section.questions.length;
                    if (speakingPart === 1 && q.order < totalQuestions / 3) return true;
                    if (speakingPart === 2 && q.order >= totalQuestions / 3 && q.order < (totalQuestions * 2) / 3) return true;
                    if (speakingPart === 3 && q.order >= (totalQuestions * 2) / 3) return true;
                  }
                  
                  return false;
                }).sort((a, b) => a.order - b.order);
              }
              
              return filteredQuestions;
            })().map((q, idx) => {
              const value = sectionAnswers[q.id];
              // For IELTS Listening and Reading, use the actual question order number
              let baseQuestionNum = 0;
              if ((section.type === "LISTENING" || section.type === "READING") && examCategory === "IELTS") {
                // Use actual order number + 1 (order is 0-based, but questions are 1-based)
                // Q1 has order 0, Q2 has order 1, etc.
                baseQuestionNum = q.order + 1;
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
                    renderQuestionComponent={(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete) => 
                      renderQuestionComponent(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete, section.type)
                    }
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
                  questionNumber={(section.type === "LISTENING" || section.type === "READING") && examCategory === "IELTS" ? baseQuestionNum : baseQuestionNum + 1}
                  renderQuestionComponent={(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete) => 
                    renderQuestionComponent(q, v, onChange, readOnly, showWordBank, externalDraggedOption, onDropComplete, section.type)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

