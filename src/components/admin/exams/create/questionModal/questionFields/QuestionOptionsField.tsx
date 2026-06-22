"use client";

import { Question } from "../../types";
import { Plus, X, Image } from "lucide-react";
import {
  countInlineSelectBlanks,
  getInlineSelectBlankChoices,
  syncInlineSelectBlanks,
} from "@/lib/inline-select-utils";

interface QuestionOptionsFieldProps {
  question: Question;
  onChange: (question: Question) => void;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

function ChoiceListEditor({
  choices,
  choiceImages,
  onChoicesChange,
  onImagesChange,
  showAlert,
  addLabel = "Add Option",
}: {
  choices: string[];
  choiceImages?: (string | undefined)[];
  onChoicesChange: (choices: string[]) => void;
  onImagesChange?: (images: (string | undefined)[]) => void;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
  addLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {choices.map((opt, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const next = [...choices];
                next[idx] = e.target.value;
                onChoicesChange(next);
              }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
              placeholder={`Option ${idx + 1}`}
            />
            {onImagesChange && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("type", "image");
                    try {
                      const res = await fetch("/api/admin/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();
                      if (data.publicPath || data.path) {
                        const imgs = [...(choiceImages || [])];
                        imgs[idx] = data.publicPath || data.path;
                        onImagesChange(imgs);
                      }
                    } catch (error) {
                      console.error("Upload error:", error);
                      showAlert("Failed to Upload Image", "Failed to upload image", "error");
                    }
                  }}
                />
                <div className="px-2 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                  <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </label>
            )}
            <button
              type="button"
              onClick={() => {
                const next = [...choices];
                next.splice(idx, 1);
                onChoicesChange(next);
                if (onImagesChange && choiceImages) {
                  const imgs = [...choiceImages];
                  imgs.splice(idx, 1);
                  onImagesChange(imgs);
                }
              }}
              className="px-2 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
          {choiceImages?.[idx] && (
            <div className="relative inline-block">
              <img
                src={choiceImages[idx]}
                alt={`Option ${idx + 1}`}
                className="h-20 w-auto rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  if (!onImagesChange || !choiceImages) return;
                  const imgs = [...choiceImages];
                  imgs[idx] = undefined;
                  onImagesChange(imgs);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
              >
                ×
              </button>
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChoicesChange([...choices, ""])}
        className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
        {addLabel}
      </button>
    </div>
  );
}

export function QuestionOptionsField({
  question,
  onChange,
  showAlert,
}: QuestionOptionsFieldProps) {
  const hasOptions = ["MCQ_SINGLE", "MCQ_MULTI", "INLINE_SELECT"].includes(question.qtype);

  if (!hasOptions) {
    return null;
  }

  // INLINE_SELECT with multiple ___ blanks: separate word lists per dropdown
  if (question.qtype === "INLINE_SELECT") {
    const promptText = question.prompt?.text || "";
    const blankCount = countInlineSelectBlanks(promptText);
    const synced = syncInlineSelectBlanks(question.options, blankCount);
    const blankChoices = getInlineSelectBlankChoices(synced, blankCount);

    if (blankCount > 1) {
      return (
        <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dropdown Options (per blank)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Each <code className="bg-gray-100 px-1 rounded">___</code> in your question text has its own
            list of words. Add different options for each dropdown.
          </p>
          <div className="space-y-4">
            {Array.from({ length: blankCount }, (_, blankIdx) => (
              <div
                key={blankIdx}
                className="p-3 bg-white border border-gray-200 rounded-md"
              >
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Dropdown {blankIdx + 1}
                </p>
                <ChoiceListEditor
                  choices={blankChoices[blankIdx] || []}
                  onChoicesChange={(nextChoices) => {
                    const blanks = [...(synced.blanks || [])];
                    blanks[blankIdx] = { choices: nextChoices };
                    onChange({
                      ...question,
                      options: { ...synced, blanks },
                    });
                  }}
                  showAlert={showAlert}
                  addLabel="Add word"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options
      </label>
      <ChoiceListEditor
        choices={question.options?.choices || []}
        choiceImages={question.options?.choiceImages}
        onChoicesChange={(choices) => {
          onChange({
            ...question,
            options: { ...question.options, choices },
          });
        }}
        onImagesChange={(choiceImages) => {
          onChange({
            ...question,
            options: { ...question.options, choiceImages },
          });
        }}
        showAlert={showAlert}
      />
    </div>
  );
}
