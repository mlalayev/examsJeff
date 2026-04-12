"use client";

import { X } from "lucide-react";
import { Question } from "../types";
import { QUESTION_TYPE_LABELS } from "../constants";
import QuestionPreview from "@/components/QuestionPreview";
import { QuestionImageUpload } from "./questionFields/QuestionImageUpload";
import { QuestionPromptField } from "./questionFields/QuestionPromptField";
import { QuestionOptionsField } from "./questionFields/QuestionOptionsField";
import { QuestionAnswerKeyField } from "./questionFields/QuestionAnswerKeyField";
import { validateImageInteractiveQuestion } from "../examValidation";

interface QuestionEditModalProps {
  question: Question;
  onClose: () => void;
  onSave: () => void;
  onChange: (question: Question) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

export function QuestionEditModal({
  question,
  onClose,
  onSave,
  onChange,
  uploadingImage,
  onImageUpload,
  showAlert,
}: QuestionEditModalProps) {
  const isEditing = question.id.startsWith("q-");

  const handleSave = () => {
    // Validate IMAGE_INTERACTIVE questions
    if (question.qtype === "IMAGE_INTERACTIVE") {
      const validation = validateImageInteractiveQuestion(question);
      if (!validation.valid) {
        showAlert(validation.error!.title, validation.error!.message, "error");
        return;
      }
    }

    onSave();
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {isEditing ? "Edit Question" : "Add Question"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-0">
          {/* Question Type */}
          <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-t-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <div className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-600">
              {QUESTION_TYPE_LABELS[question.qtype]}
            </div>
          </div>

          {/* Image Upload */}
          <QuestionImageUpload
            question={question}
            onChange={onChange}
            uploadingImage={uploadingImage}
            onImageUpload={onImageUpload}
            showAlert={showAlert}
          />

          {/* Prompt Field */}
          <QuestionPromptField
            question={question}
            onChange={onChange}
            uploadingImage={uploadingImage}
            onImageUpload={onImageUpload}
            showAlert={showAlert}
          />

          {/* Options Field (for MCQ, INLINE_SELECT, etc.) */}
          <QuestionOptionsField
            question={question}
            onChange={onChange}
            showAlert={showAlert}
          />

          {/* Answer Key */}
          <QuestionAnswerKeyField
            question={question}
            onChange={onChange}
          />
        </div>

        {/* Question Preview */}
        <QuestionPreview question={question} />

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: "#303380" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#303380";
            }}
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
}
