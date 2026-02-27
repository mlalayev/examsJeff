"use client";

import { useState, useEffect } from "react";
import { X, Edit, Trash2, Image as ImageIcon, Eye, Upload } from "lucide-react";
import QuestionPreview from "@/components/QuestionPreview";
import ImageUpload from "@/components/ImageUpload";

interface Question {
  id: string;
  qtype: string;
  order: number;
  prompt: any;
  options: any;
  answerKey: any;
  maxScore: number;
  explanation?: any;
  image?: string | null;
}

interface Section {
  id: string;
  type: string;
  title: string;
  questions: Question[];
}

interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  examCategory: string;
  sections: Section[];
  onSave: (updatedQuestions: Question[], sectionId: string) => void;
}

export default function ExamEditModal({
  isOpen,
  onClose,
  examId,
  examCategory,
  sections,
  onSave,
}: ExamEditModalProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (isOpen && sections.length > 0) {
      setSelectedSectionId(sections[0].id);
    }
  }, [isOpen, sections]);

  if (!isOpen) return null;

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // Get IELTS parts for the section
  const getIELTSParts = () => {
    if (examCategory !== "IELTS" || !selectedSection) return [];

    if (selectedSection.type === "LISTENING") {
      return [
        { num: 1, label: "Part 1 (Q1-10)", range: [0, 9] },
        { num: 2, label: "Part 2 (Q11-20)", range: [10, 19] },
        { num: 3, label: "Part 3 (Q21-30)", range: [20, 29] },
        { num: 4, label: "Part 4 (Q31-40)", range: [30, 39] },
      ];
    } else if (selectedSection.type === "READING") {
      return [
        { num: 1, label: "Part 1 (Q1-14)", range: [0, 13] },
        { num: 2, label: "Part 2 (Q15-27)", range: [14, 26] },
        { num: 3, label: "Part 3 (Q28-40)", range: [27, 39] },
      ];
    } else if (selectedSection.type === "WRITING") {
      return [
        { num: 1, label: "Task 1", range: [0, 0] },
        { num: 2, label: "Task 2", range: [1, 1] },
      ];
    } else if (selectedSection.type === "SPEAKING") {
      return [
        { num: 1, label: "Part 1", range: [0, 5] },
        { num: 2, label: "Part 2", range: [6, 10] },
        { num: 3, label: "Part 3", range: [11, 20] },
      ];
    }

    return [];
  };

  const parts = getIELTSParts();

  // Filter questions by selected part
  const getFilteredQuestions = () => {
    if (!selectedSection) return [];

    if (examCategory === "IELTS" && parts.length > 0) {
      const part = parts.find(p => p.num === selectedPart);
      if (part) {
        return selectedSection.questions.filter(
          q => q.order >= part.range[0] && q.order <= part.range[1]
        );
      }
    }

    return selectedSection.questions;
  };

  const filteredQuestions = getFilteredQuestions().sort((a, b) => a.order - b.order);

  const handleImageUpload = async (file: File, questionId: string) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Update the question
      if (editingQuestion && editingQuestion.id === questionId) {
        setEditingQuestion({ ...editingQuestion, image: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion || !selectedSection) return;

    const updatedQuestions = selectedSection.questions.map(q =>
      q.id === editingQuestion.id ? editingQuestion : q
    );

    onSave(updatedQuestions, selectedSection.id);
    setEditingQuestion(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-[#303380]" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Edit Exam Questions
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                Choose a section and, for IELTS, the part you want to modify.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Section & Part Selection */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Sections</h3>
              <div className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      setSelectedPart(1);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedSectionId === section.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs mt-1 opacity-75">
                      {section.questions.length} questions
                    </div>
                  </button>
                ))}
              </div>

              {/* IELTS Parts Selection */}
              {examCategory === "IELTS" && parts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {selectedSection?.type === "WRITING" ? "Tasks" : "Parts"}
                  </h3>
                  <div className="space-y-2">
                    {parts.map(part => (
                      <button
                        key={part.num}
                        onClick={() => setSelectedPart(part.num)}
                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedPart === part.num
                            ? "bg-indigo-600 text-white shadow"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {part.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Questions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No questions in this {parts.length > 0 ? "part" : "section"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {q.order + 1}
                        </span>
                        <div>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 font-medium">
                            {q.qtype}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewQuestion(q);
                            setShowPreview(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Preview */}
                    <div className="text-sm text-gray-700">
                      {typeof q.prompt === "object" && q.prompt?.text ? (
                        <p className="line-clamp-2">{q.prompt.text}</p>
                      ) : (
                        <p className="text-gray-400 italic">No question text</p>
                      )}
                    </div>

                    {/* Image indicator */}
                    {(q.image || q.prompt?.imageUrl) && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                        <ImageIcon className="w-4 h-4" />
                        <span>Has image</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Question {editingQuestion.order + 1}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Upload */}
              <ImageUpload
                label="Question Image (Optional)"
                value={editingQuestion.image || editingQuestion.prompt?.imageUrl || ""}
                onChange={(url) => {
                  setEditingQuestion({
                    ...editingQuestion,
                    image: url,
                    prompt: { ...editingQuestion.prompt, imageUrl: url },
                  });
                }}
                showHelperText={true}
              />

              {/* Question Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Question Text
                </label>
                <textarea
                  value={editingQuestion.prompt?.text || ""}
                  onChange={(e) => {
                    setEditingQuestion({
                      ...editingQuestion,
                      prompt: { ...editingQuestion.prompt, text: e.target.value },
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  rows={6}
                  placeholder="Enter question text..."
                />
              </div>

              {/* Answer Key (simplified) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Answer Key
                </label>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(editingQuestion.answerKey, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">
                Question Preview
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewQuestion(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <QuestionPreview question={previewQuestion} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

