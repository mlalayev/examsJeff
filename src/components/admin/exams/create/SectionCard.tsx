"use client";

import { useState, useEffect } from "react";
import { X, Edit, Image, BookOpen, Save, Volume2 } from "lucide-react";
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
  const [selectedReadingPart, setSelectedReadingPart] = useState<number>(1);
  
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
                {selectedCategory === "IELTS" ? (
                  <>
                    {section.title}
                    <span className="ml-2 text-xs text-gray-500">({section.durationMin} min)</span>
                  </>
                ) : (
                  <>
                    Section {index + 1}: {section.title}
                  </>
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
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 ${
                  selectedCategory === "IELTS"
                    ? (typeof section.passage === "object" && section.passage && 
                       (section.passage as any).part1 && 
                       (section.passage as any).part2 && 
                       (section.passage as any).part3
                        ? "text-green-700 bg-green-50 hover:bg-green-100"
                        : "text-orange-700 bg-orange-50 hover:bg-orange-100 animate-pulse")
                    : (section.passage && typeof section.passage === "string"
                        ? "text-green-700 bg-green-50 hover:bg-green-100"
                        : "text-orange-700 bg-orange-50 hover:bg-orange-100 animate-pulse")
                }`}
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {selectedCategory === "IELTS" 
                    ? (typeof section.passage === "object" && section.passage && 
                       (section.passage as any).part1 && 
                       (section.passage as any).part2 && 
                       (section.passage as any).part3
                        ? "✓ All Passages Added"
                        : "Add Passages (3)")
                    : (section.passage && typeof section.passage === "string" 
                        ? "✓ Passage Added" 
                        : "Add Passage")
                  }
                </span>
                <span className="sm:hidden">Passage</span>
              </button>
            )}
            {/* Listening section: Upload Audio button */}
            {section.type === "LISTENING" && selectedCategory === "IELTS" && (
              <button
                onClick={() => setIsEditing(true)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md flex items-center gap-1.5 ${
                  section.audio 
                    ? "text-green-700 bg-green-50 hover:bg-green-100" 
                    : "text-orange-700 bg-orange-50 hover:bg-orange-100 animate-pulse"
                }`}
              >
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{section.audio ? "✓ Audio Uploaded" : "Upload Audio"}</span>
                <span className="sm:hidden">{section.audio ? "✓ Audio" : "Audio"}</span>
              </button>
            )}
            {!(selectedCategory === "IELTS") && (
              <button
                onClick={onDelete}
                disabled={isActive}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
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
                    if (selectedCategory !== "IELTS") {
                      setEditingSection({
                        ...editingSection,
                        title: e.target.value,
                      });
                    }
                  }}
                  disabled={selectedCategory === "IELTS"}
                  placeholder="Enter section title..."
                  className={`w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent ${
                    selectedCategory === "IELTS" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                  }`}
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
                    if (selectedCategory !== "IELTS") {
                      setEditingSection({
                        ...editingSection,
                        instruction: e.target.value,
                      });
                    }
                  }}
                  disabled={selectedCategory === "IELTS"}
                  placeholder="Enter section instruction..."
                  className={`w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent resize-y ${
                    selectedCategory === "IELTS" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                  }`}
                  rows={3}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  value={editingSection.durationMin || ""}
                  onChange={(e) => {
                    if (selectedCategory !== "IELTS") {
                      setEditingSection({
                        ...editingSection,
                        durationMin: parseInt(e.target.value) || 0,
                      });
                    }
                  }}
                  disabled={selectedCategory === "IELTS"}
                  placeholder="Enter duration in minutes..."
                  className={`w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent ${
                    selectedCategory === "IELTS" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"
                  }`}
                  min="1"
                />
              </div>

              {/* Reading Passages (IELTS - 3 parts) */}
              {section.type === "READING" && selectedCategory === "IELTS" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reading Passages (3 passages for IELTS) *
                  </label>
                  
                  {/* Part Selector - Clean Tab Design */}
                  <div className="flex gap-0 border-b-2 border-gray-200 mb-4">
                    {[1, 2, 3].map((partNum) => (
                      <button
                        key={partNum}
                        type="button"
                        onClick={() => setSelectedReadingPart(partNum)}
                        className={`px-6 py-2.5 text-sm font-medium transition-all border-b-2 -mb-0.5 ${
                          selectedReadingPart === partNum
                            ? "text-[#303380] border-[#303380] bg-white"
                            : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Passage {partNum}
                      </button>
                    ))}
                  </div>
                  
                  {/* Passage Text for Selected Part */}
                  {[1, 2, 3].map((partNum) => (
                    <div key={partNum} className={selectedReadingPart === partNum ? "block" : "hidden"}>
                      <textarea
                        value={
                          typeof editingSection.passage === "object" && editingSection.passage !== null
                            ? (editingSection.passage as any)[`part${partNum}`] || ""
                            : partNum === 1 && typeof editingSection.passage === "string"
                            ? editingSection.passage
                            : ""
                        }
                        onChange={(e) => {
                          const currentPassages = typeof editingSection.passage === "object" && editingSection.passage !== null
                            ? editingSection.passage
                            : {};
                          setEditingSection({
                            ...editingSection,
                            passage: {
                              ...currentPassages,
                              [`part${partNum}`]: e.target.value,
                            } as any,
                          });
                        }}
                        placeholder={`Enter the reading passage text for Passage ${partNum}...`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent resize-y bg-white"
                        rows={12}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reading Passage (Non-IELTS) */}
              {section.type === "READING" && selectedCategory !== "IELTS" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Reading Passage *
                  </label>
                  <textarea
                    value={typeof editingSection.passage === "string" ? editingSection.passage : ""}
                    onChange={(e) => {
                      setEditingSection({
                        ...editingSection,
                        passage: e.target.value,
                      });
                    }}
                    placeholder="Enter the reading passage text..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent resize-y bg-white"
                    rows={10}
                  />
                </div>
              )}

              {/* Listening Audio */}
              {section.type === "LISTENING" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Listening Audio *
                  </label>
                  {editingSection.audio && (
                    <div className="mb-2 p-2.5 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <span className="font-medium">✓</span>
                        <span className="truncate">{editingSection.audio}</span>
                      </div>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#303380] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  />
                  {uploadingAudio && (
                    <p className="mt-1.5 text-xs text-gray-500">Uploading audio file...</p>
                  )}
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedCategory !== "IELTS") {
                      if (!editingSection.title?.trim()) {
                        alert("Please enter a section title");
                        return;
                      }
                      if (!editingSection.instruction?.trim()) {
                        alert("Please enter a section instruction");
                        return;
                      }
                    }
                    if (editingSection.type === "READING" && selectedCategory === "IELTS") {
                      const passages = editingSection.passage as any;
                      if (!passages?.part1?.trim() || !passages?.part2?.trim() || !passages?.part3?.trim()) {
                        alert("Please enter all 3 reading passages");
                        return;
                      }
                    }
                    if (editingSection.type === "READING" && selectedCategory !== "IELTS") {
                      if (!editingSection.passage || typeof editingSection.passage !== "string" || !editingSection.passage.trim()) {
                        alert("Please enter a reading passage");
                        return;
                      }
                    }
                    if (editingSection.type === "LISTENING" && !editingSection.audio) {
                      alert("Please upload an audio file");
                      return;
                    }
                    handleSave();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md flex items-center gap-2 transition-colors"
                  style={{ backgroundColor: "#303380" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#252a6b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#303380";
                  }}
                >
                  <Save className="w-4 h-4" />
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

