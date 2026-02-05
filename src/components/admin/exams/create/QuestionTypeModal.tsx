"use client";

import { X } from "lucide-react";
import type { QuestionType } from "./types";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_GROUPS } from "./constants";

interface QuestionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: QuestionType) => void;
}

export default function QuestionTypeModal({ isOpen, onClose, onSelect }: QuestionTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Select Question Type</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {Object.entries(QUESTION_TYPE_GROUPS).map(([groupName, types], groupIndex) => (
            <div key={groupName} className={groupIndex > 0 ? "pt-4 sm:pt-6 border-t-2 border-gray-300" : ""}>
              <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{groupName}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => onSelect(type as QuestionType)}
                    className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 text-left transition text-sm"
                  >
                    <div className="font-medium text-gray-900">
                      {QUESTION_TYPE_LABELS[type as QuestionType]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

