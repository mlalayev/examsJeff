"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  const sentences = question.prompt?.sentences || [];
  const options = question.prompt?.options || [];
  
  // Initialize value as object with sentence indices as keys
  const currentAnswers = value || {};
  
  const [draggedOption, setDraggedOption] = useState<string | null>(null);
  const [usedOptions, setUsedOptions] = useState<Set<string>>(new Set(Object.values(currentAnswers)));

  const handleDrop = (sentenceIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !draggedOption) return;
    
    const newAnswers = { ...currentAnswers };
    newAnswers[sentenceIndex] = draggedOption;
    onChange(newAnswers);
    
    setUsedOptions(prev => new Set([...prev, draggedOption]));
    setDraggedOption(null);
  };

  const handleDragStart = (option: string, e: React.DragEvent) => {
    if (readOnly) return;
    setDraggedOption(option);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const removeAnswer = (sentenceIndex: number) => {
    if (readOnly) return;
    const newAnswers = { ...currentAnswers };
    const removedOption = newAnswers[sentenceIndex];
    delete newAnswers[sentenceIndex];
    onChange(newAnswers);
    
    if (removedOption) {
      setUsedOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete(removedOption);
        return newSet;
      });
    }
  };

  const renderSentence = (sentence: string, index: number) => {
    const parts = sentence.split('___');
    const answer = currentAnswers[index];
    
    return (
      <div key={index} className="mb-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-600">{index + 1}.</span>
          <span className="text-gray-800">
            {parts[0]}
            <span
              onDrop={(e) => handleDrop(index, e)}
              onDragOver={handleDragOver}
              className={`inline-block min-w-[60px] h-7 border border-dashed rounded px-2 py-1 mx-1 ${
                answer 
                  ? "border-green-200 bg-green-50 text-green-700" 
                  : "border-gray-300 bg-gray-50 text-gray-500"
              } ${!readOnly ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50" : ""}`}
            >
              {answer || "___"}
            </span>
            {parts[1]}
          </span>
          {answer && !readOnly && (
            <button
              onClick={() => removeAnswer(index)}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Sentences */}
      <div className="space-y-2">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      {/* Options */}
      <div className="border-t border-gray-200 pt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Choose from:</h4>
        <div className="flex flex-wrap gap-2">
          {options.map((option: string) => {
            const isUsed = usedOptions.has(option);
            return (
              <div
                key={option}
                draggable={!readOnly && !isUsed}
                onDragStart={(e) => handleDragStart(option, e)}
                className={`px-3 py-2 rounded border text-sm ${
                  isUsed
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-300 text-gray-700 cursor-move hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {option}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

