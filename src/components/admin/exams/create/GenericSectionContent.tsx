"use client";

import { Volume2 } from "lucide-react";
import type { Section } from "./types";

interface GenericSectionContentProps {
  section: Section;
}

/**
 * Displays generic section content (passage for Reading, audio status for Listening)
 */
export default function GenericSectionContent({ section }: GenericSectionContentProps) {
  if (section.type === "READING") {
    return (
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Reading Passage
          </label>
        </div>
        {section.passage && typeof section.passage === "string" ? (
          <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {section.passage.substring(0, 200)}...
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No passage added yet. Go back to sections and click &quot;Add Passage&quot;.
          </p>
        )}
      </div>
    );
  }

  if (section.type === "LISTENING") {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Listening Audio
          </label>
        </div>
        {section.audio ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
              <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm text-gray-700 flex-1 truncate">{section.audio}</span>
              <span className="text-xs text-green-600 font-medium shrink-0">✓ Uploaded</span>
            </div>
            <audio controls src={section.audio} className="w-full mt-1" preload="metadata" />
            <p className="text-xs text-blue-700">
              To change audio, go back to sections and click &quot;Upload Audio&quot;.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">
              No audio uploaded yet. Go back to sections and click &quot;Upload Audio&quot;.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
