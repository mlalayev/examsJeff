"use client";

import { Plus, BookOpen } from "lucide-react";
import SectionCard from "./SectionCard";
import type { Section, ExamCategory, SectionType } from "./types";
import { sortIELTSSections, getSectionLabel, ALLOWED_SECTIONS_BY_CATEGORY } from "./constants";

interface SectionsListProps {
  sections: Section[];
  selectedCategory: ExamCategory | null;
  currentSection: Section | null;
  step: "category" | "sections" | "questions";
  selectedSectionType: SectionType | "";
  onSectionTypeChange: (type: SectionType | "") => void;
  onAddSection: (type: SectionType) => void;
  onSectionEdit: (section: Section) => void;
  onSectionDelete: (sectionId: string) => void;
  onAddSubsection: (sectionId: string) => void;
  onSectionEditModal: (section: Section) => void;
  onSubsectionEdit: (subsection: Section) => void;
  onSubsectionDelete: (subsection: Section, sections: Section[], setSections: (s: Section[]) => void, setCurrentSection: (s: Section | null) => void) => void;
  setSections: (sections: Section[]) => void;
  setCurrentSection: (section: Section | null) => void;
}

export default function SectionsList({
  sections,
  selectedCategory,
  currentSection,
  step,
  selectedSectionType,
  onSectionTypeChange,
  onAddSection,
  onSectionEdit,
  onSectionDelete,
  onAddSubsection,
  onSectionEditModal,
  onSubsectionEdit,
  onSubsectionDelete,
  setSections,
  setCurrentSection,
}: SectionsListProps) {
  const allowedSectionTypes = selectedCategory 
    ? ALLOWED_SECTIONS_BY_CATEGORY[selectedCategory] 
    : [];

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-medium text-gray-900">Sections</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <select
            value={selectedSectionType}
            onChange={(e) => onSectionTypeChange(e.target.value as SectionType | "")}
            disabled={!selectedCategory || allowedSectionTypes.length === 0}
            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {!selectedCategory 
                ? "Select exam category first" 
                : allowedSectionTypes.length === 0 
                ? "No sections available" 
                : "Select Section Type..."}
            </option>
            {allowedSectionTypes.map((type) => {
              const isSectionDisabled = 
                selectedCategory === "IELTS" && 
                sections.some(s => s.type === type);

              return (
                <option 
                  key={type} 
                  value={type}
                  disabled={isSectionDisabled}
                >
                  {getSectionLabel(type, selectedCategory)}
                  {isSectionDisabled ? " (Already added)" : ""}
                </option>
              );
            })}
          </select>
          <button
            onClick={() => {
              if (selectedSectionType) {
                onAddSection(selectedSectionType);
                onSectionTypeChange("");
              }
            }}
            disabled={!selectedSectionType}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "#252a6b";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = "#303380";
              }
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Section</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-8 sm:p-12 text-center">
          <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2 text-sm sm:text-base">No sections added yet</p>
          <p className="text-xs sm:text-sm text-gray-500">Select a section type and click "Add Section" to get started</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {(selectedCategory === "IELTS" ? sortIELTSSections(sections) : sections).map((section, idx) => {
            const isActive = currentSection?.id === section.id && step === "questions";
            const hasSubsections = section.subsections && section.subsections.length > 0;
            return (
              <SectionCard
                key={section.id}
                section={section}
                index={idx}
                isActive={isActive}
                selectedCategory={selectedCategory}
                onEdit={() => onSectionEdit(section)}
                onDelete={() => onSectionDelete(section.id)}
                onAddSubsection={section.type === "LISTENING" && selectedCategory === "IELTS" && hasSubsections ? () => onAddSubsection(section.id) : undefined}
                onEditSection={section.type === "LISTENING" && selectedCategory === "IELTS" && hasSubsections ? () => onSectionEditModal(section) : undefined}
                onSubsectionEdit={(subsection) => {
                  onSubsectionEdit(subsection);
                }}
                onSubsectionDelete={(subsection) => onSubsectionDelete(subsection, sections, setSections, setCurrentSection)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

