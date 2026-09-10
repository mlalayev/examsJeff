"use client";

import type { ExamCategory } from "./types";
import {
  ENGLISH_LEVELS,
  PLACEMENT_MULTI_TITLE,
  PLACEMENT_TRACK_MULTI,
  isEnglishLevelId,
  isPlacementMultiTrack,
  placementTestTitle,
} from "@/lib/english-levels";

interface ExamInfoFormProps {
  examTitle: string;
  onExamTitleChange: (title: string) => void;
  selectedCategory: ExamCategory | null;
  track: string;
  onTrackChange: (track: string) => void;
  durationMin: number | null;
  onDurationMinChange: (duration: number | null) => void;
}

export default function ExamInfoForm({
  examTitle,
  onExamTitleChange,
  selectedCategory,
  track,
  onTrackChange,
  durationMin,
  onDurationMinChange,
}: ExamInfoFormProps) {
  const isPlacement = selectedCategory === "PLACEMENT";
  const isMulti = isPlacementMultiTrack(track);
  const singleLevelTitle = isEnglishLevelId(track) ? placementTestTitle(track) : "";

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isPlacement ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Placement mode *
              </label>
              <select
                value={track}
                onChange={(e) => {
                  const next = e.target.value;
                  onTrackChange(next);
                  if (isPlacementMultiTrack(next)) {
                    onExamTitleChange(PLACEMENT_MULTI_TITLE);
                  } else if (isEnglishLevelId(next)) {
                    onExamTitleChange(placementTestTitle(next));
                  } else {
                    onExamTitleChange("");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                required
              >
                <option value="">Select mode</option>
                <option value={PLACEMENT_TRACK_MULTI}>
                  Full test (A1 → B2, multi-level questions)
                </option>
                {ENGLISH_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    Single band: {level.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Full tests tag each question with its own CEFR level. Single-band
                tests default new questions to that level.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Exam Title {isMulti ? "*" : ""}
              </label>
              {isMulti ? (
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => onExamTitleChange(e.target.value)}
                  placeholder={PLACEMENT_MULTI_TITLE}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={singleLevelTitle}
                  readOnly
                  placeholder="Select a level"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-800"
                />
              )}
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Exam Title *
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => onExamTitleChange(e.target.value)}
              placeholder="e.g., General English A2 - Unit 1"
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
        )}
        {selectedCategory === "GENERAL_ENGLISH" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Track (Level) *
            </label>
            <select
              value={track}
              onChange={(e) => onTrackChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
              required
            >
              <option value="">Select level</option>
              {ENGLISH_LEVELS.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.label}
                </option>
              ))}
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Duration (minutes){" "}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            value={durationMin || ""}
            onChange={(e) =>
              onDurationMinChange(e.target.value ? parseInt(e.target.value) : null)
            }
            placeholder="e.g., 60"
            min="1"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
