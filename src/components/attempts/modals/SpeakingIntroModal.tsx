"use client";

import React from "react";

interface SpeakingIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCENT = "#303380";

export function SpeakingIntroModal({ isOpen, onClose }: SpeakingIntroModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ borderColor: "rgba(48, 51, 128, 0.2)", borderWidth: "1px" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 rounded-t-2xl"
          style={{ backgroundColor: ACCENT }}
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            IELTS Speaking — Instructions
          </h2>
          <p className="text-white/90 text-sm mt-1 font-medium">
            Please read carefully before you begin
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div
            className="px-4 py-3 rounded-lg font-semibold text-sm"
            style={{
              backgroundColor: "rgba(48, 51, 128, 0.08)",
              color: ACCENT,
              borderLeft: "4px solid " + ACCENT,
            }}
          >
            ⚠️ Attention — read this
          </div>

          <p className="text-gray-700 text-sm leading-relaxed">
            You will see each question for a few seconds before your response time begins.
            Answer clearly into your microphone. Your response will be recorded automatically.
          </p>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Time per question
            </p>
            <ul className="space-y-2 text-sm text-gray-800">
              <li className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  1
                </span>
                <span>
                  <strong>Part 1</strong> — 35 seconds per question. Short answers about familiar topics.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  2
                </span>
                <span>
                  <strong>Part 2</strong> — 3 minutes total: 1 minute to prepare, then 2 minutes to speak. You will see a cue card with a topic and bullet points.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  3
                </span>
                <span>
                  <strong>Part 3</strong> — 65 seconds per question. Deeper discussion linked to Part 2.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-gray-600 text-sm">
            Use the part buttons (P1, P2, P3) in the sidebar to switch between question sets.
            A timer and progress bar will show your remaining time. Good luck.
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ backgroundColor: ACCENT }}
          >
            Okay, start speaking
          </button>
        </div>
      </div>
    </div>
  );
}
