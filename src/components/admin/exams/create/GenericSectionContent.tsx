"use client";

import type { Section } from "./types";

interface GenericSectionContentProps {
  section: Section;
}

/**
 * Displays generic section content (single passage for Reading, simple audio note for Listening)
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
          <p className="text-xs text-gray-500">No passage added yet. Go back to sections and click "Edit Passage".</p>
        )}
      </div>
    );
  }

  return null;
}
