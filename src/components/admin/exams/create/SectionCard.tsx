"use client";

import { useState, useEffect } from "react";
import { X, Edit, Image, BookOpen, Save } from "lucide-react";
import type { Section, ExamCategory } from "./types";
import { IELTS_SECTION_COLORS, IELTS_SECTION_ICONS } from "./constants";
import ImageUpload from "@/components/ImageUpload";

interface SectionCardProps {
  section: Section;
  index: number;
  isActive: boolean;
  selectedCategory: ExamCategory | null;
  onEdit?: () => void;
  onDelete: () => void;
  onSectionUpdate?: (updatedSection: Section) => void;
  sections?: Section[];
  setSections?: (sections: Section[]) => void;
  setCurrentSection?: (section: Section | null) => void;
}

export default function SectionCard({
  section,
  index,
  isActive,
  selectedCategory,
  onEdit,
  onDelete,
  onSectionUpdate,
  sections = [],
  setSections,
  setCurrentSection,
}: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<Section>(section);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  const isIELTS = selectedCategory === "IELTS";
  const sectionColors = isIELTS ? IELTS_SECTION_COLORS[section.type] : null;
  const SectionIcon = isIELTS ? IELTS_SECTION_ICONS[section.type] : BookOpen;

  const handleSave = () => {
    // Update main section
    if (onSectionUpdate && setSections) {
      onSectionUpdate(editingSection);
      const updatedSections = sections.map((s: Section) =>
        s.id === section.id ? editingSection : s
      );
      setSections(updatedSections);
      if (setCurrentSection) {
        // Update currentSection if it matches the edited section
        const updatedSection = updatedSections.find((s: Section) => s.id === section.id);
        if (updatedSection) {
          setCurrentSection(updatedSection);
        }
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingSection(section);
    setIsEditing(false);
  };

  // Update editingSection when section prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditingSection(section);
    }
  }, [section, isEditing]);

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
              <span className="text-xs sm:text-sm text-gray-500">
                ({section.questions.length} {section.questions.length === 1 ? "question" : "questions"})
              </span>
              {isActive && (
                <span className="text-xs px-2 py-1 bg-slate-900 text-white rounded-full font-medium">
                  Editing
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{section.instruction}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onEdit?.()}
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
            {/* Reading section: Edit Passage button */}
            {section.type === "READING" && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-1.5"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit Passage</span>
                <span className="sm:hidden">Passage</span>
              </button>
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

        {/* Inline Edit Form - Inside the section card */}
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Section Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Section Title *
              </label>
              <input
                type="text"
                value={editingSection.title || ""}
                onChange={(e) => {
                  setEditingSection({
                    ...editingSection,
                    title: e.target.value,
                  });
                }}
                placeholder="Enter section title..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Section Instruction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Section Instruction *
              </label>
              <textarea
                value={editingSection.instruction || ""}
                onChange={(e) => {
                  setEditingSection({
                    ...editingSection,
                    instruction: e.target.value,
                  });
                }}
                placeholder="Enter section instruction..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                rows={3}
              />
            </div>

            {/* Duration (for IELTS) */}
            {selectedCategory === "IELTS" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={editingSection.durationMin || ""}
                  onChange={(e) => {
                    setEditingSection({
                      ...editingSection,
                      durationMin: parseInt(e.target.value) || 0,
                    });
                  }}
                  placeholder="Enter duration in minutes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  min="1"
                />
              </div>
            )}

            {/* Reading Passage */}
            {section.type === "READING" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reading Passage *
                </label>
                <textarea
                  value={editingSection.passage || ""}
                  onChange={(e) => {
                    setEditingSection({
                      ...editingSection,
                      passage: e.target.value,
                    });
                  }}
                  placeholder="Enter the reading passage text..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  rows={10}
                />
              </div>
            )}

            {/* Listening Audio */}
            {section.type === "LISTENING" && !editingSection.isSubsection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Listening Audio (All Parts) *
                </label>
                {selectedCategory === "IELTS" && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      📝 IELTS Listening Requirements:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                      <li>Must have exactly <strong>40 questions</strong> (10 per part)</li>
                      <li>4 parts: Conversation (1), Monologue (2), Discussion (3), Lecture (4)</li>
                      <li>Audio will play automatically with restrictions (no pause/seek for students)</li>
                      <li><strong>One audio file for all 4 parts</strong></li>
                    </ul>
                  </div>
                )}
                <div className="space-y-2">
                  {editingSection.audio ? (
                    <div className="p-2 bg-gray-50 rounded-md text-sm text-gray-600">
                      Current: {editingSection.audio}
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-50 rounded-md text-sm text-blue-600">
                      Audio will be shared across all 4 parts
                    </div>
                  )}
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const validAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
                      const hasValidExtension = validAudioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

                      if (!hasValidExtension) {
                        alert("Please upload a valid audio file (mp3, wav, ogg, m4a, aac, flac, wma)");
                        return;
                      }

                      setUploadingAudio(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("type", "audio");

                        const res = await fetch("/api/admin/upload", {
                          method: "POST",
                          body: formData,
                        });

                        if (res.ok) {
                          const data = await res.json();
                          const updatedSection = {
                            ...editingSection,
                            audio: data.path,
                            subsections: editingSection.subsections?.map((sub: Section) => ({ ...sub, audio: data.path })),
                          };
                          setEditingSection(updatedSection);
                        } else {
                          alert("Failed to upload audio");
                        }
                      } catch (error) {
                        console.error("Upload error:", error);
                        alert("Failed to upload audio");
                      } finally {
                        setUploadingAudio(false);
                      }
                    }}
                    disabled={uploadingAudio}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
                  />
                  {uploadingAudio && (
                    <p className="text-xs text-gray-500">Uploading...</p>
                  )}
                </div>
              </div>
            )}

            {/* Save/Cancel Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editingSection.title?.trim()) {
                    alert("Please enter a section title");
                    return;
                  }
                  if (!editingSection.instruction?.trim()) {
                    alert("Please enter a section instruction");
                    return;
                  }
                  if (selectedCategory === "IELTS" && (!editingSection.durationMin || editingSection.durationMin <= 0)) {
                    alert("Please enter a valid duration");
                    return;
                  }
                  if (editingSection.type === "READING" && !editingSection.passage?.trim()) {
                    alert("Please enter a reading passage");
                    return;
                  }
                  if (editingSection.type === "LISTENING" && !editingSection.audio) {
                    alert("Please upload an audio file");
                    return;
                  }
                  handleSave();
                }}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#303380";
                }}
              >
                <Save className="w-4 h-4 inline mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

