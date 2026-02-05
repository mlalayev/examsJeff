"use client";

import { Plus, X, Edit, Volume2, Image, BookOpen } from "lucide-react";
import type { Section, ExamCategory } from "./types";
import { IELTS_SECTION_COLORS, IELTS_SECTION_ICONS } from "./constants";

interface SectionCardProps {
  section: Section;
  index: number;
  isActive: boolean;
  selectedCategory: ExamCategory | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubsection?: () => void;
  onEditSection?: () => void;
  onSubsectionEdit?: (subsection: Section) => void;
  onSubsectionDelete?: (subsection: Section) => void;
}

export default function SectionCard({
  section,
  index,
  isActive,
  selectedCategory,
  onEdit,
  onDelete,
  onAddSubsection,
  onEditSection,
  onSubsectionEdit,
  onSubsectionDelete,
}: SectionCardProps) {
  const hasSubsections = section.subsections && section.subsections.length > 0;
  const isIELTS = selectedCategory === "IELTS";
  const sectionColors = isIELTS ? IELTS_SECTION_COLORS[section.type] : null;
  const SectionIcon = isIELTS ? IELTS_SECTION_ICONS[section.type] : BookOpen;

  return (
    <div>
      {/* Main Section */}
      <div
        className={`rounded-md p-4 sm:p-6 transition ${
          isIELTS && sectionColors ? "border-2" : "border-l-4"
        } ${
          isActive && !isIELTS
            ? "bg-slate-50"
            : "hover:bg-gray-50"
        }`}
        style={isIELTS && sectionColors ? {
          borderColor: sectionColors.border,
          backgroundColor: isActive ? sectionColors.bg : "white",
        } : {
          borderLeftColor: isActive ? "#1e293b" : "#e5e7eb",
          backgroundColor: isActive ? "#f8fafc" : "white",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              {/* Icon - sol üstdə */}
              {isIELTS && sectionColors && (
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: sectionColors.iconBg }}
                >
                  <SectionIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                Section {index + 1}: {section.title}
                {selectedCategory === "IELTS" && (
                  <span className="ml-2 text-xs text-gray-500">({section.durationMin} min)</span>
                )}
              </h3>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                {section.type}
              </span>
              {!hasSubsections && (
                <span className="text-xs sm:text-sm text-gray-500">
                  ({section.questions.length} {section.questions.length === 1 ? "question" : "questions"})
                </span>
              )}
              {hasSubsections && (
                <span className="text-xs sm:text-sm text-blue-600 font-medium">
                  ({section.subsections?.length || 0} parts)
                </span>
              )}
              {isActive && (
                <span className="text-xs px-2 py-1 bg-slate-900 text-white rounded-full font-medium">
                  Editing
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{section.instruction}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!hasSubsections && (
              <button
                onClick={onEdit}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-white flex items-center gap-1.5 sm:gap-2"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isActive ? "Continue Editing" : "Edit Section"}</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
            {/* IELTS Listening: Upload Audio button */}
            {section.type === "LISTENING" && selectedCategory === "IELTS" && hasSubsections && (
              <>
                <button
                  onClick={onEditSection}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-1.5"
                >
                  <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{section.audio ? "Change Audio" : "Upload Audio"}</span>
                  <span className="sm:hidden">Audio</span>
                </button>
                <button
                  onClick={onAddSubsection}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Add Part</span>
                  <span className="sm:hidden">Part</span>
                </button>
              </>
            )}
            <button
              onClick={onDelete}
              disabled={isActive}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subsections */}
      {hasSubsections && (
        <div className="ml-6 mt-2 space-y-2">
          {section.subsections?.map((subsection) => {
            // Note: isSubActive should be calculated based on currentSection if needed
            const isSubActive = false;
            return (
              <div
                key={subsection.id}
                className={`bg-slate-50 border-l-4 rounded-r-md p-3 sm:p-4 transition ${
                  isSubActive
                    ? "border-l-[#303380] bg-[#303380]/5 shadow-sm"
                    : "border-l-gray-300 hover:border-l-gray-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {subsection.title}
                      </h4>
                      <span className="text-xs text-gray-500">
                        ({subsection.questions.length} questions)
                      </span>
                      {isSubActive && (
                        <span className="text-xs px-2 py-0.5 bg-[#303380] text-white rounded-full font-medium">
                          Editing
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{subsection.instruction}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSubsectionEdit?.(subsection)}
                      className="px-2 sm:px-3 py-1 rounded text-xs font-medium text-white flex items-center gap-1"
                      style={{ backgroundColor: "#303380" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#252a6b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#303380";
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      <span>Questions</span>
                    </button>
                    <button
                      onClick={() => onEditSection?.()}
                      className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 flex items-center gap-1"
                    >
                      <Image className="w-3 h-3" />
                      <span>Image/Intro</span>
                    </button>
                    <button
                      onClick={() => onSubsectionDelete?.(subsection)}
                      className="px-2 sm:px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

