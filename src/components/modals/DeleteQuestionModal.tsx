"use client";

import React from "react";
import { Trash2, X } from "lucide-react";

interface DeleteQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questionText?: string;
  questionNumber?: number;
  isDeleting?: boolean;
}

export const DeleteQuestionModal: React.FC<DeleteQuestionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questionText,
  questionNumber,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shadow-lg">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Delete Question</h3>
          <p className="text-sm text-gray-600">This action cannot be undone</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Are you sure you want to delete {questionNumber ? `question ${questionNumber}` : "this question"}?
          </p>
          {questionText && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
              <p className="text-xs font-medium text-gray-600 mb-1">Question Preview:</p>
              <p className="text-sm text-gray-800 line-clamp-2">
                {typeof questionText === "string" 
                  ? questionText.length > 100 
                    ? questionText.substring(0, 100) + "..." 
                    : questionText
                  : "Question"}
              </p>
            </div>
          )}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-800 leading-relaxed">
              <strong>Warning:</strong> This will permanently remove the question from the exam. All associated data will be lost.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Question
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

