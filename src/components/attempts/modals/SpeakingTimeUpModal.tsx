"use client";

import React, { useEffect, useRef } from "react";
import { Clock } from "lucide-react";

const ACCENT = "#303380";

interface SpeakingTimeUpModalProps {
  isOpen: boolean;
  onConfirm: () => void; // Called when user clicks OK or when auto-submit runs
  autoSubmitDelayMs?: number; // After this delay, call onConfirm automatically (default 3000)
}

export function SpeakingTimeUpModal({
  isOpen,
  onConfirm,
  autoSubmitDelayMs = 3000,
}: SpeakingTimeUpModalProps) {
  const hasConfirmed = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasConfirmed.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (hasConfirmed.current) return;
      hasConfirmed.current = true;
      onConfirm();
    }, autoSubmitDelayMs);
    return () => clearTimeout(t);
  }, [isOpen, autoSubmitDelayMs, onConfirm]);

  if (!isOpen) return null;

  const handleOk = () => {
    if (hasConfirmed.current) return;
    hasConfirmed.current = true;
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="flex justify-center mb-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            >
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No time left
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            The time for the Speaking section has ended. Your exam will be submitted automatically.
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={handleOk}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-95"
            style={{ backgroundColor: ACCENT }}
          >
            OK — Submit exam
          </button>
        </div>
      </div>
    </div>
  );
}
