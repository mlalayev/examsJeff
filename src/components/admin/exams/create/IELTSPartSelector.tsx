"use client";

import { Volume2, BookOpen, PenTool, Mic } from "lucide-react";
import type { SectionType, Question } from "./types";

interface IELTSPartSelectorProps {
  sectionType: SectionType;
  currentPart: number;
  onPartChange: (part: number) => void;
  questions: Question[];
}

const LISTENING_PARTS = [
  { num: 1, label: "Conversation" },
  { num: 2, label: "Monologue" },
  { num: 3, label: "Discussion" },
  { num: 4, label: "Lecture" },
];

const READING_PARTS = [
  { num: 1, label: "Passage 1" },
  { num: 2, label: "Passage 2" },
  { num: 3, label: "Passage 3" },
];

const WRITING_TASKS = [
  { num: 1, label: "Task 1", desc: "20 min, 150+ words" },
  { num: 2, label: "Task 2", desc: "40 min, 250+ words" },
];

const SPEAKING_PARTS = [
  { num: 1, label: "Part 1", desc: "Interview" },
  { num: 2, label: "Part 2", desc: "Long Turn" },
  { num: 3, label: "Part 3", desc: "Discussion" },
];

export default function IELTSPartSelector({
  sectionType,
  currentPart,
  onPartChange,
  questions,
}: IELTSPartSelectorProps) {
  const getConfig = () => {
    switch (sectionType) {
      case "LISTENING":
        return {
          parts: LISTENING_PARTS,
          title: "Select Listening Part",
          description: "Choose which part to add questions to (40 questions total, 10 per part)",
          icon: Volume2,
          colors: { bg: "from-blue-50 to-indigo-50", border: "border-blue-200", text: "text-blue-600", label: "bg-blue-100 text-blue-700" },
          currentLabel: `Part ${currentPart}`,
          partKey: "part",
        };
      case "READING":
        return {
          parts: READING_PARTS,
          title: "Select Reading Passage",
          description: "Choose which passage to add questions to (40 questions total, ~13 per passage)",
          icon: BookOpen,
          colors: { bg: "from-green-50 to-emerald-50", border: "border-green-200", text: "text-green-600", label: "bg-green-100 text-green-700" },
          currentLabel: `Passage ${currentPart}`,
          partKey: "part",
        };
      case "WRITING":
        return {
          parts: WRITING_TASKS,
          title: "Select Writing Task",
          description: "Choose which task to add questions to (Task 1: 150+ words, Task 2: 250+ words)",
          icon: PenTool,
          colors: { bg: "from-orange-50 to-amber-50", border: "border-orange-200", text: "text-orange-600", label: "bg-orange-100 text-orange-700" },
          currentLabel: `Task ${currentPart}`,
          partKey: "task",
        };
      case "SPEAKING":
        return {
          parts: SPEAKING_PARTS,
          title: "Select Speaking Part",
          description: "Choose which part to add questions to (Part 1: Interview, Part 2: Long turn, Part 3: Discussion)",
          icon: Mic,
          colors: { bg: "from-red-50 to-pink-50", border: "border-red-200", text: "text-red-600", label: "bg-red-100 text-red-700" },
          currentLabel: `Part ${currentPart}`,
          partKey: "part",
        };
      default:
        return null;
    }
  };

  const config = getConfig();
  if (!config) return null;

  const Icon = config.icon;
  const partIdentifier = config.partKey === "task" ? "task" : "part";

  return (
    <div className={`mb-4 p-4 bg-gradient-to-br ${config.colors.bg} border-2 ${config.colors.border} rounded-lg`}>
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.colors.text}`} />
          {config.title}
        </h4>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>
      <div className={`grid ${sectionType === "WRITING" ? "grid-cols-2" : sectionType === "READING" ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-2 sm:gap-3`}>
        {config.parts.map((part: any) => {
          const questionCount = questions.filter(q => 
            q.id.includes(`${partIdentifier}${part.num}`)
          ).length;

          return (
            <button
              key={part.num}
              onClick={() => onPartChange(part.num)}
              className={`px-4 py-3 rounded-lg font-medium text-sm transition-all border-2 ${
                currentPart === part.num
                  ? "bg-[#303380] text-white border-[#303380] shadow-lg transform scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-[#303380]"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold">{part.label}</span>
                {part.desc && <span className="text-xs opacity-90">{part.desc}</span>}
                <span className="text-[10px] opacity-75">{questionCount} Qs</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className={`mt-3 p-2 bg-white rounded border ${config.colors.border}`}>
        <p className={`text-xs ${config.colors.label.replace('bg-', 'text-').replace('-100', '-800')} font-medium`}>
          Currently editing: <span className="text-[#303380]">{config.currentLabel}</span>
        </p>
      </div>
    </div>
  );
}
