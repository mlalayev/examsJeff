"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) => {
  if (!isOpen) return null;

  const iconMap = {
    warning: <AlertTriangle className="w-8 h-8 text-amber-600" />,
    danger: <AlertTriangle className="w-8 h-8 text-red-600" />,
    info: <AlertTriangle className="w-8 h-8 text-blue-600" />,
  };

  const bgMap = {
    warning: "bg-amber-50",
    danger: "bg-red-50",
    info: "bg-blue-50",
  };

  const buttonBgMap = {
    warning: "bg-amber-600 hover:bg-amber-700",
    danger: "bg-red-600 hover:bg-red-700",
    info: "bg-[#303380] hover:bg-[#252a6b]",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 relative">
          <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full ${bgMap[type]} flex items-center justify-center`}>
              {iconMap[type]}
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {title}
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
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm hover:shadow-md ${buttonBgMap[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};




