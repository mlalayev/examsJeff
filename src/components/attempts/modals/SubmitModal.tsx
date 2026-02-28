"use client";

import React from "react";
import { ClipboardCheck, X } from "lucide-react";

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header with icon */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 relative">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-[#303380]/10 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-[#303380]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Finish exam?
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
          <p className="text-sm text-gray-700 leading-relaxed">
            Are you sure you want to submit this exam? You will not be able to
            change your answers after submitting.
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
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-[#303380] hover:bg-[#252a6b] transition-colors shadow-sm hover:shadow-md"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
