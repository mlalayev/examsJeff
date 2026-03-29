"use client";

import { Edit, X, BookOpen } from "lucide-react";
import type { Question, ExamCategory, SectionType } from "./types";
import { QUESTION_TYPE_LABELS } from "./constants";
import { filterQuestionsByPart, getIELTSPartLabel, calculateIELTSGlobalQuestionNumber } from "./ieltsHelpers";

interface QuestionsListProps {
  questions: Question[];
  examCategory: ExamCategory;
  sectionType: SectionType;
  currentPart?: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
}

/**
 * Displays the list of questions for a section, with IELTS part filtering if applicable
 */
export default function QuestionsList({
  questions,
  examCategory,
  sectionType,
  currentPart,
  onEdit,
  onDelete,
}: QuestionsListProps) {
  let filteredQuestions = questions;
  
  if (examCategory === "IELTS" && currentPart) {
    filteredQuestions = filterQuestionsByPart(questions, sectionType, currentPart);
  }

  if (filteredQuestions.length === 0) {
    let partLabel = "";
    if (examCategory === "IELTS" && currentPart) {
      partLabel = getIELTSPartLabel(sectionType, currentPart);
    }
    
    return (
      <div className="text-center py-8 sm:py-12 text-gray-500 border border-dashed border-gray-300 rounded-md bg-gray-50 mt-4">
        <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
        <p className="font-medium text-gray-700 mb-2 text-sm sm:text-base">
          {partLabel ? `No questions in ${partLabel} yet` : "No questions in this section yet"}
        </p>
        <p className="text-xs sm:text-sm text-gray-600">
          Click "Add Question" above to add your first question
          {partLabel && ` to ${partLabel}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {filteredQuestions.map((q, idx) => {
        let globalQuestionNumber = idx + 1;
        
        if (examCategory === "IELTS" && currentPart) {
          globalQuestionNumber = calculateIELTSGlobalQuestionNumber(
            questions,
            sectionType,
            currentPart,
            idx
          );
        }
        
        return (
          <div key={q.id} className="border border-gray-200 rounded-md p-3 sm:p-4 hover:border-gray-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Q{globalQuestionNumber}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                  {QUESTION_TYPE_LABELS[q.qtype]}
                </span>
                {examCategory === "IELTS" && currentPart && (
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    sectionType === "LISTENING" ? "bg-blue-100 text-blue-700" :
                    sectionType === "READING" ? "bg-green-100 text-green-700" :
                    sectionType === "WRITING" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {getIELTSPartLabel(sectionType, currentPart)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(q)}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(q.id)}
                  className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              {typeof q.prompt === "object" && q.prompt.text
                ? q.prompt.text
                : typeof q.prompt === "string"
                  ? q.prompt
                  : JSON.stringify(q.prompt)}
            </div>
            {q.image && (
              <div className="mt-2 text-xs text-gray-500">
                Image: {q.image}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
