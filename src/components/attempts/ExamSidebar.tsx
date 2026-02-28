"use client";

import React from "react";
import { Send, Clock, Check } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { SectionListItem } from "./SectionListItem";

interface Section {
  id: string;
  type: string;
  title: string;
  questions: any[];
  order: number;
}

interface ReadingPartProgress {
  answered: number;
  total: number;
  percentage: number;
}

interface ExamSidebarProps {
  examTitle: string;
  sections: Section[];
  activeSection: string; // Now stores section.id
  lockedSections: Set<string>; // Now stores section.id
  completedSections?: Set<string>; // IELTS completed sections
  progressStats: { answered: number; total: number; percentage: number };
  sectionStats: Record<string, { answered: number; total: number }>; // Key is section.id now
  submitting: boolean;
  isSAT?: boolean;
  currentSectionIndex?: number;
  onSectionClick: (sectionId: string) => Promise<void>;
  onSubmit: () => void | Promise<void>;
  onSubmitModule?: () => void | Promise<void>;
  getShortSectionTitle: (title: string) => string;
  examCategory?: string; // IELTS, SAT, TOEFL
  // IELTS: timer and part choosers for all section types (Listening, Reading, Writing, Speaking)
  isIELTS?: boolean;
  currentSectionType?: string; // LISTENING | READING | WRITING | SPEAKING
  isIELTSReading?: boolean; // kept for backward compat, prefer isIELTS + currentSectionType
  readingPart?: number;
  onReadingPartChange?: (part: number) => void;
  readingTimerState?: IELTSTimerState | null;
  readingPartProgress?: ReadingPartProgress[];
  listeningPart?: number;
  onListeningPartChange?: (part: number) => void;
  listeningTimerState?: IELTSTimerState | null;
  listeningPartProgress?: ReadingPartProgress[];
  writingPart?: number;
  onWritingPartChange?: (part: number) => void;
  writingTimerState?: IELTSTimerState | null;
  writingPartProgress?: ReadingPartProgress[];
  speakingPart?: number;
  onSpeakingPartChange?: (part: number) => void;
  speakingTimerState?: IELTSTimerState | null;
  speakingPartProgress?: ReadingPartProgress[];
}

type IELTSTimerState = {
  timeRemaining: number;
  isExpired: boolean;
  formatTime: (s: number) => string;
  getTimeColor: () => string;
};

export const ExamSidebar = React.memo(function ExamSidebar({
  examTitle,
  sections,
  activeSection,
  lockedSections,
  completedSections,
  progressStats,
  sectionStats,
  submitting,
  isSAT = false,
  currentSectionIndex = 0,
  onSectionClick,
  onSubmit,
  onSubmitModule,
  getShortSectionTitle,
  examCategory,
  isIELTS = false,
  currentSectionType,
  isIELTSReading = false,
  readingPart = 1,
  onReadingPartChange,
  readingTimerState,
  readingPartProgress = [],
  listeningPart = 1,
  onListeningPartChange,
  listeningTimerState,
  listeningPartProgress = [],
  writingPart = 1,
  onWritingPartChange,
  writingTimerState,
  writingPartProgress = [],
  speakingPart = 1,
  onSpeakingPartChange,
  speakingTimerState,
  speakingPartProgress = [],
}: ExamSidebarProps) {
  const ACCENT = "#303380";
  const DONE = "#059669";

  const renderTimer = (state: IELTSTimerState) => {
    const timeColorClass = state.getTimeColor();
    const timeColor = timeColorClass === "text-red-600" ? "#dc2626" : timeColorClass === "text-orange-600" ? "#ea580c" : "rgb(55 65 81)";
    return (
      <div
        className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg"
        style={
          state.isExpired
            ? { backgroundColor: "rgb(254 226 226)", color: "#dc2626" }
            : { backgroundColor: "rgb(243 244 246)", color: timeColor }
        }
      >
        <Clock className="w-4 h-4 shrink-0 opacity-80" style={{ color: "inherit" }} />
        <span className="text-sm font-bold tabular-nums" style={{ color: "inherit" }}>
          {state.formatTime(state.timeRemaining)}
        </span>
      </div>
    );
  };

  const sectionOrder = ["LISTENING", "READING", "WRITING", "SPEAKING"];

  const activeSectionObj = sections.find((s) => s.id === activeSection);
  const activeTypeIndex = activeSectionObj
    ? sectionOrder.indexOf(activeSectionObj.type)
    : -1;

  const nextType =
    activeTypeIndex >= 0 && activeTypeIndex < sectionOrder.length - 1
      ? sectionOrder[activeTypeIndex + 1]
      : null;

  // Filter sections
  const displayedSections = false 
    ? sections.filter((section, index, arr) => {
        if (section.type === "LISTENING") {
          // Show only the first LISTENING section
          const firstListeningIndex = arr.findIndex(s => s.type === "LISTENING");
          return index === firstListeningIndex;
        }
        if (section.type === "READING") {
          // Show only the first READING section
          const firstReadingIndex = arr.findIndex(s => s.type === "READING");
          return index === firstReadingIndex;
        }
        // Show all other sections normally
        return true;
      })
    : sections;

  return (
    <div className="lg:w-64 flex-shrink-0">
      <div
        className="rounded-xl shadow-sm border p-4 sticky top-3 flex flex-col h-[calc(100vh-1.5rem)]"
        style={{
          backgroundColor: "rgba(48, 51, 128, 0.01)",
          borderColor: "rgba(48, 51, 128, 0.1)",
        }}
      >
        {/* Exam Info - Top */}
        <div className="mb-4">
          <h2
            className="text-sm font-semibold mb-1 truncate"
            title={examTitle}
            style={{ color: "rgba(48, 51, 128, 0.9)" }}
          >
            {examTitle}
          </h2>
          <p
            className="text-xs"
            style={{ color: "rgba(48, 51, 128, 0.6)" }}
          >
            Exam Sections
          </p>
          <ProgressBar
            answered={progressStats.answered}
            total={progressStats.total}
            percentage={progressStats.percentage}
          />
        </div>

        {/* IELTS: Timer + part/task choosers for current section (Listening, Reading, Writing, Speaking) */}
        {isIELTS && currentSectionType && (
          <div
            className="mb-4 rounded-lg border p-3 flex flex-col gap-3"
            style={{
              borderColor: "rgba(48, 51, 128, 0.2)",
              backgroundColor: "rgba(255,255,255,0.6)",
            }}
          >
            {currentSectionType === "LISTENING" && (
              <>
                <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                  Listening
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                  {[1, 2, 3, 4].map((p) => {
                    const progress = listeningPartProgress[p - 1] ?? { answered: 0, total: 1, percentage: 0 };
                    const isActive = listeningPart === p;
                    const isDone = progress.percentage >= 100;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onListeningPartChange?.(p)}
                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-0.5 min-w-0 transition-colors duration-200 text-xs font-semibold ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        style={isActive ? { backgroundColor: ACCENT } : undefined}
                        title={`Part ${p}: ${progress.answered}/${progress.total}`}
                      >
                        <span>P{p}</span>
                        <span className={`text-[10px] font-medium tabular-nums mt-0.5 ${isActive ? "text-white/90" : "text-gray-500"}`}>{progress.answered}/{progress.total}</span>
                        {isDone && <span className={`absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"}`}><Check className="h-1.5 w-1.5" strokeWidth={3} /></span>}
                      </button>
                    );
                  })}
                </div>
                {listeningTimerState && renderTimer(listeningTimerState)}
              </>
            )}
            {currentSectionType === "READING" && (
              <>
                <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                  Reading
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                  {[1, 2, 3].map((p) => {
                    const progress = readingPartProgress[p - 1] ?? { answered: 0, total: 1, percentage: 0 };
                    const isActive = readingPart === p;
                    const isDone = progress.percentage >= 100;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onReadingPartChange?.(p)}
                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 min-w-0 transition-colors duration-200 text-xs font-semibold ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        style={isActive ? { backgroundColor: ACCENT } : undefined}
                        title={`Passage ${p}: ${progress.answered}/${progress.total}`}
                      >
                        <span>P{p}</span>
                        <span className={`text-[10px] font-medium tabular-nums mt-0.5 ${isActive ? "text-white/90" : "text-gray-500"}`}>{progress.answered}/{progress.total}</span>
                        {isDone && <span className={`absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"}`}><Check className="h-1.5 w-1.5" strokeWidth={3} /></span>}
                      </button>
                    );
                  })}
                </div>
                {readingTimerState && renderTimer(readingTimerState)}
              </>
            )}
            {currentSectionType === "WRITING" && (
              <>
                <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                  Writing
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                  {[1, 2].map((p) => {
                    const progress = writingPartProgress[p - 1] ?? { answered: 0, total: 1, percentage: 0 };
                    const isActive = writingPart === p;
                    const isDone = progress.percentage >= 100;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onWritingPartChange?.(p)}
                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 min-w-0 transition-colors duration-200 text-xs font-semibold ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        style={isActive ? { backgroundColor: ACCENT } : undefined}
                        title={`Task ${p}: ${progress.answered}/${progress.total}`}
                      >
                        <span>T{p}</span>
                        <span className={`text-[10px] font-medium tabular-nums mt-0.5 ${isActive ? "text-white/90" : "text-gray-500"}`}>{progress.answered}/{progress.total}</span>
                        {isDone && <span className={`absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"}`}><Check className="h-1.5 w-1.5" strokeWidth={3} /></span>}
                      </button>
                    );
                  })}
                </div>
                {writingTimerState && renderTimer(writingTimerState)}
              </>
            )}
            {currentSectionType === "SPEAKING" && (
              <>
                <div className="text-xs font-semibold" style={{ color: ACCENT }}>
                  Speaking
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                  {[1, 2, 3].map((p) => {
                    const progress = speakingPartProgress[p - 1] ?? { answered: 0, total: 1, percentage: 0 };
                    const isActive = speakingPart === p;
                    const isDone = progress.percentage >= 100;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onSpeakingPartChange?.(p)}
                        className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 min-w-0 transition-colors duration-200 text-xs font-semibold ${isActive ? "text-white" : "text-gray-700 hover:bg-gray-50"}`}
                        style={isActive ? { backgroundColor: ACCENT } : undefined}
                        title={`Part ${p}: ${progress.answered}/${progress.total}`}
                      >
                        <span>P{p}</span>
                        <span className={`text-[10px] font-medium tabular-nums mt-0.5 ${isActive ? "text-white/90" : "text-gray-500"}`}>{progress.answered}/{progress.total}</span>
                        {isDone && <span className={`absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full ${isActive ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-600"}`}><Check className="h-1.5 w-1.5" strokeWidth={3} /></span>}
                      </button>
                    );
                  })}
                </div>
                {speakingTimerState && renderTimer(speakingTimerState)}
              </>
            )}
          </div>
        )}

        {/* Sections List - Middle */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <style jsx>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #cbd5e1 #f1f5f9;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 2px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>
          <div className="space-y-2 pr-1">
            {displayedSections.map((section, index) => {
              const isActive = activeSection === section.id;
              const isLocked = lockedSections.has(section.id);
              const isCompleted = completedSections?.has(section.id) || false;
              const stats = sectionStats[section.id] || {
                answered: 0,
                total: 0,
              };

              let isDisabled = false;

              if (examCategory === "IELTS") {
                // IELTS: yalnız cari section və ondan sonrakı ilk section type aktiv olsun.
                const isCurrent = isActive;

                let isNextTypeFirstSection = false;
                if (nextType && section.type === nextType) {
                  const firstIndexOfNextType = sections.findIndex(
                    (s) => s.type === nextType
                  );
                  isNextTypeFirstSection = firstIndexOfNextType === index;
                }

                // Əvvəlki section-lar və daha sonrakı bütün section-lar disabled,
                // yalnız cari və növbəti type-ın ilk section-u kliklənə bilir.
                isDisabled = !isCurrent && !isNextTypeFirstSection;
              } else {
                // SAT üçün: yalnız cari, keçmiş və locked modullar aktiv
                isDisabled =
                  isSAT && index > currentSectionIndex && !isLocked;
              }

              return (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isActive={isActive}
                  isLocked={isLocked}
                  isDisabled={isDisabled}
                  isCompleted={isCompleted}
                  answeredCount={stats.answered}
                  totalCount={stats.total}
                  onClick={() => onSectionClick(section.id)}
                  getShortSectionTitle={getShortSectionTitle}
                />
              );
            })}
          </div>
        </div>

        {/* Submit Button - Bottom */}
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
          {/* SAT Submit Module Button */}
          {isSAT && onSubmitModule && (
            <button
              onClick={onSubmitModule}
              disabled={submitting || lockedSections.has(activeSection)}
              className="w-full px-4 py-2.5 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#059669" }}
              onMouseEnter={(e) => {
                if (!submitting && !lockedSections.has(activeSection)) {
                  e.currentTarget.style.backgroundColor = "#047857";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#059669";
              }}
            >
              <Send className="w-4 h-4" />
              Submit Module
            </button>
          )}

          {/* Submit Exam Button */}
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="w-full px-4 py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#303380";
            }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Exam
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 text-center mt-2">
            You cannot change answers after submission
          </p>
        </div>
      </div>
    </div>
  );
});

