import { CheckCircle2, XCircle } from "lucide-react";
import type { ResultsData } from "./types";

interface SectionResultsProps {
  sections: ResultsData["sections"];
  onSectionClick: (section: any) => void;
  role: "STUDENT" | "TEACHER";
}

export function SectionResults({ sections, onSectionClick, role }: SectionResultsProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Section Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, idx) => (
          <div
            key={idx}
            onClick={() => role === "TEACHER" && onSectionClick(section)}
            className={`bg-white border border-gray-200 rounded-lg p-4 ${
              role === "TEACHER" ? "hover:shadow-md cursor-pointer transition-shadow" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              {section.percentage >= 75 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Correct</span>
                <span className="font-medium text-gray-900">
                  {section.correct}/{section.total}
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    section.percentage >= 75
                      ? "bg-green-500"
                      : section.percentage >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${section.percentage}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{section.type}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {section.percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* IELTS Listening Part Breakdown */}
            {role === "TEACHER" && section.type === "LISTENING" && section.listeningParts && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Part Breakdown:</p>
                <div className="grid grid-cols-4 gap-1">
                  {Object.entries(section.listeningParts).map(([part, score]) => (
                    <div key={part} className="text-center">
                      <div className="text-xs font-medium text-gray-700">
                        {part.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-600">{score}/10</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
