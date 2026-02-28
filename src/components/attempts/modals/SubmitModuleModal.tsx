"use client";

import React from "react";
import { Send, X } from "lucide-react";

interface SubmitModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sectionTitle: string;
}

export const SubmitModuleModal: React.FC<SubmitModuleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sectionTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 relative">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center">
              <Send className="w-8 h-8 text-[#059669]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Finish this module?
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            You are about to submit the current section:
          </p>
          <p className="text-sm font-medium text-gray-900 mb-2">
            {sectionTitle || "Current section"}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            After submitting, you will not be able to change answers in this
            section.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-[#059669] hover:bg-[#047857] transition-colors shadow-sm hover:shadow-md"
          >
            Submit section
          </button>
        </div>
      </div>
    </div>
  );
};
