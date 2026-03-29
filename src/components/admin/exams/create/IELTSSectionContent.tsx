"use client";

import { BookOpen, Volume2 } from "lucide-react";
import type { Section } from "./types";

interface IELTSSectionContentProps {
  section: Section;
}

/**
 * Displays IELTS-specific section content (passages for Reading, audio for Listening)
 */
export default function IELTSSectionContent({ section }: IELTSSectionContentProps) {
  if (section.type === "READING") {
    return (
      <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-green-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Reading Passages (3 passages)
          </label>
        </div>
        {typeof section.passage === "object" && section.passage ? (
          <div className="space-y-2">
            {[1, 2, 3].map((partNum) => {
              const passage = (section.passage as any)[`part${partNum}`];
              return (
                <div key={partNum} className={`p-2 rounded border ${
                  passage ? "bg-white border-green-200" : "bg-yellow-50 border-yellow-200"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">Passage {partNum}:</span>
                    {passage ? (
                      <span className="text-xs text-green-600 font-medium">✓ Added</span>
                    ) : (
                      <span className="text-xs text-yellow-600 font-medium">⚠️ Not added</span>
                    )}
                  </div>
                  {passage && (
                    <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-20 overflow-y-auto">
                      {passage.substring(0, 150)}...
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-green-700 mt-2">
              To edit passages, go back to sections and click "Edit Passage".
            </p>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">
              ⚠️ No passages added yet! Go back to sections and click "Edit Passage" to add all 3 passages.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (section.type === "LISTENING") {
    return (
      <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Listening Audio (Shared for all 4 parts)
          </label>
        </div>
        {section.audio ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700 flex-1">{section.audio}</span>
              <span className="text-xs text-green-600 font-medium">✓ Uploaded</span>
            </div>
            <p className="text-xs text-blue-700">
              Audio is shared across all 4 parts. To change, go back to sections and click the edit button.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium">
              ⚠️ No audio uploaded yet! Go back to sections and click the "Edit Section" button to upload audio.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
