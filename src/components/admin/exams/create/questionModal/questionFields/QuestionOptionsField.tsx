"use client";

import { Question } from "../../types";
import { Plus, X, Image } from "lucide-react";

interface QuestionOptionsFieldProps {
  question: Question;
  onChange: (question: Question) => void;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

export function QuestionOptionsField({
  question,
  onChange,
  showAlert,
}: QuestionOptionsFieldProps) {
  // Only show for question types that have options
  const hasOptions = ["MCQ_SINGLE", "MCQ_MULTI", "INLINE_SELECT"].includes(question.qtype);

  if (!hasOptions) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Options
      </label>
      <div className="space-y-3">
        {(question.options?.choices || []).map((opt: string, idx: number) => (
          <div key={idx} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(question.options?.choices || [])];
                  newOptions[idx] = e.target.value;
                  onChange({
                    ...question,
                    options: {
                      ...question.options,
                      choices: newOptions,
                    },
                  });
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                placeholder={`Option ${idx + 1}`}
              />
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

                    try {
                      const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const data = await res.json();

                      if (data.url) {
                        const newOptionsImages = [...(question.options?.choiceImages || [])];
                        newOptionsImages[idx] = data.url;
                        onChange({
                          ...question,
                          options: {
                            ...question.options,
                            choiceImages: newOptionsImages,
                          },
                        });
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
              <button
                onClick={() => {
                  const newOptions = [...(question.options?.choices || [])];
                  newOptions.splice(idx, 1);
                  const newImages = [...(question.options?.choiceImages || [])];
                  newImages.splice(idx, 1);
                  onChange({
                    ...question,
                    options: {
                      ...question.options,
                      choices: newOptions,
                      choiceImages: newImages,
                    },
                  });
                }}
                className="px-2 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            {question.options?.choiceImages?.[idx] && (
              <div className="relative inline-block">
                <img
                  src={question.options.choiceImages[idx]}
                  alt={`Option ${idx + 1}`}
                  className="h-20 w-auto rounded border border-gray-200"
                />
                <button
                  onClick={() => {
                    const newImages = [...(question.options?.choiceImages || [])];
                    newImages[idx] = undefined;
                    onChange({
                      ...question,
                      options: {
                        ...question.options,
                        choiceImages: newImages,
                      },
                    });
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
          onClick={() => {
            const newOptions = [...(question.options?.choices || []), ""];
            onChange({
              ...question,
              options: {
                ...question.options,
                choices: newOptions,
              },
            });
          }}
          className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
          Add Option
        </button>
      </div>
    </div>
  );
}
