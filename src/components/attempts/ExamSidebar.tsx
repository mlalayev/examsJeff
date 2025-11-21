"use client";

import React from "react";
import { Send } from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { SectionListItem } from "./SectionListItem";

interface Section {
  id: string;
  type: string;
  title: string;
  questions: any[];
  order: number;
}

interface ExamSidebarProps {
  examTitle: string;
  sections: Section[];
  activeSection: string;
  lockedSections: Set<string>;
  progressStats: { answered: number; total: number; percentage: number };
  sectionStats: Record<string, { answered: number; total: number }>;
  submitting: boolean;
  onSectionClick: (sectionType: string) => Promise<void>;
  onSubmit: () => Promise<void>;
  getShortSectionTitle: (title: string) => string;
}

export const ExamSidebar = React.memo(function ExamSidebar({
  examTitle,
  sections,
  activeSection,
  lockedSections,
  progressStats,
  sectionStats,
  submitting,
  onSectionClick,
  onSubmit,
  getShortSectionTitle,
}: ExamSidebarProps) {
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
            {sections.map((section) => {
              const isActive = activeSection === section.type;
              const isLocked = lockedSections.has(section.type);
              const stats = sectionStats[section.type] || {
                answered: 0,
                total: 0,
              };

              return (
                <SectionListItem
                  key={section.type}
                  section={section}
                  isActive={isActive}
                  isLocked={isLocked}
                  answeredCount={stats.answered}
                  totalCount={stats.total}
                  onClick={() => onSectionClick(section.type)}
                  getShortSectionTitle={getShortSectionTitle}
                />
              );
            })}
          </div>
        </div>

        {/* Submit Button - Bottom */}
        <div className="mt-4 pt-4 border-t border-slate-200">
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

