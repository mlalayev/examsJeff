"use client";

import { Question } from "../../types";

interface QuestionImageUploadProps {
  question: Question;
  onChange: (question: Question) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

export function QuestionImageUpload({
  question,
  onChange,
  uploadingImage,
  onImageUpload,
  showAlert,
}: QuestionImageUploadProps) {
  return (
    <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Question Image <span className="text-gray-500 font-normal">(Optional)</span>
      </label>
      <div className="space-y-2">
        {question.image && (
          <div className="p-3 bg-white border border-gray-200 rounded-md">
            <img
              src={question.image}
              alt="Question"
              className="max-w-full h-auto max-h-48 rounded border border-gray-200"
            />
            <p className="text-xs text-gray-500 mt-2">{question.image}</p>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...question,
                  image: undefined,
                });
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Remove Image
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await onImageUpload(file);
            }
          }}
          disabled={uploadingImage}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 bg-white"
        />
        {uploadingImage && (
          <p className="text-xs text-gray-500">Uploading image...</p>
        )}
        <p className="text-xs text-gray-500">
          Upload diagrams, charts, or any visual content for your question
        </p>
      </div>
    </div>
  );
}
