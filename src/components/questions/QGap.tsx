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
      <div key={index} className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-600">{index + 1}.</span>
          <span className="text-slate-800">
            {parts[0]}
            <span
              onDrop={(e) => handleDrop(index, e)}
              onDragOver={handleDragOver}
              className={`inline-block min-w-[80px] h-8 border-2 border-dashed rounded px-2 py-1 mx-1 ${
                answer 
                  ? "border-green-300 bg-green-50 text-green-800" 
                  : "border-slate-300 bg-slate-50 text-slate-500"
              } ${!readOnly ? "cursor-pointer hover:border-blue-400" : ""}`}
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
    <div className="space-y-6">
      {/* Sentences */}
      <div className="space-y-2">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      {/* Options */}
      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Choose from:</h4>
        <div className="flex flex-wrap gap-2">
          {options.map((option: string) => {
            const isUsed = usedOptions.has(option);
            return (
              <div
                key={option}
                draggable={!readOnly && !isUsed}
                onDragStart={(e) => handleDragStart(option, e)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isUsed
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border-slate-300 text-slate-700 cursor-move hover:border-blue-400 hover:shadow-md"
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

