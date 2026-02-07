"use client";

import React from "react";
import { AlertCircle, CheckCircle2, XCircle, Info, X } from "lucide-react";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      headerBg: "from-green-50 to-emerald-50",
      buttonBg: "bg-green-600 hover:bg-green-700",
    },
    error: {
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      headerBg: "from-red-50 to-pink-50",
      buttonBg: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      headerBg: "from-amber-50 to-yellow-50",
      buttonBg: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      headerBg: "from-blue-50 to-indigo-50",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 text-center border-b border-gray-100 bg-gradient-to-r ${config.headerBg}`}>
          <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center shadow-lg`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className={`w-full px-4 py-2.5 text-sm font-medium text-white ${config.buttonBg} rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors shadow-sm hover:shadow-md`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

