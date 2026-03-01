"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface IELTSSectionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromSection: string;
  toSection: string;
}

export function IELTSSectionChangeModal({
  isOpen,
  onClose,
  onConfirm,
  fromSection,
  toSection,
}: IELTSSectionChangeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 relative">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Leave this section?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-gray-700">{fromSection}</span>
            {" → "}
            <span className="font-medium text-gray-700">{toSection}</span>
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              ⚠️ Your timer is still running
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              You are leaving this section before the time is up. Once you move on, you
              will <strong>not</strong> be able to return to this section or review your
              answers.
            </p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you still have time remaining, we strongly recommend staying in the current
            section to review your responses. Once you proceed, this section will be
            permanently closed.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Stay &amp; Review
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md px-6 py-1.5 text-sm font-medium text-white bg-[#303380] hover:bg-[#252a6b] transition-colors shadow-sm"
          >
            Leave Section
          </button>
        </div>
      </div>
    </div>
  );
}
