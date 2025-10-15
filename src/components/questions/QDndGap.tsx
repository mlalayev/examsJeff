"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QDndGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  let sentences = [];
  
  if (question.prompt?.textWithBlanks) {
    const text = question.prompt.textWithBlanks;
    if (text.includes('\n')) {
      sentences = text.split('\n').filter((line: string) => line.trim());
    } else if (text.includes('1.') && text.includes('2.')) {
      sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
    } else {
      sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
    }
  } else if (question.prompt?.sentences) {
    sentences = question.prompt.sentences;
  } else {
    sentences = [
      "I ___ running.",
      "You ___ playing.",
      "He ___ reading."
    ];
  }
  
  const options = question.options?.bank || ["am", "is", "are"];
  
  const currentAnswers = value || {};
  
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  const usedOptions = new Set(Object.values(currentAnswers));

  const handleDrop = (gapKey: string, e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !draggedOption) return;
    
    const newAnswers = { ...currentAnswers };
    
    const existingKey = Object.keys(newAnswers).find(key => 
      newAnswers[key] === draggedOption && key !== gapKey
    );
    
    if (existingKey) {
      delete newAnswers[existingKey];
    }
    
    newAnswers[gapKey] = draggedOption;
    onChange(newAnswers);
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

  const handleDragEnd = () => {
    setDraggedOption(null);
  };

  const removeAnswer = (gapKey: string) => {
    if (readOnly) return;
    const newAnswers = { ...currentAnswers };
    delete newAnswers[gapKey];
    onChange(newAnswers);
  };

  const renderSentence = (sentence: string, index: number) => {
    // Clean the sentence - remove leading numbers and dots
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    const parts = cleanSentence.split('___');
    
    const gapCount = parts.length - 1;
    
    return (
      <div key={index} className="mb-4 group">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-600">{index + 1}.</span>
          <div className="flex items-center gap-1 flex-wrap">
            {parts.map((part, partIndex) => (
              <div key={partIndex} className="flex items-center gap-1">
                <span className="text-gray-800">{part}</span>
                {partIndex < parts.length - 1 && (
                  <span
                    onDrop={(e) => handleDrop(`${index}-${partIndex}`, e)}
                    onDragOver={handleDragOver}
                    className={`relative inline-block min-w-[60px] h-7 border border-dashed rounded px-2 py-1 group/gap ${
                      currentAnswers[`${index}-${partIndex}`]
                        ? "border-green-200 bg-green-50 text-green-700" 
                        : "border-gray-300 bg-gray-50 text-gray-500"
                    } ${!readOnly ? "cursor-pointer hover:border-slate-300 hover:bg-slate-50" : ""}`}
                  >
                    {currentAnswers[`${index}-${partIndex}`] || "___"}
                    {currentAnswers[`${index}-${partIndex}`] && !readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnswer(`${index}-${partIndex}`);
                        }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition opacity-0 group-hover/gap:opacity-100"
                      >
                        ×
                      </button>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Sentences */}
      <div className="space-y-4">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      {/* Options */}
      <div className="pt-4">
        <div className="text-xs text-gray-500 mb-3">Choose from:</div>
        <div className="flex flex-wrap gap-2">
          {options.map((option: string) => {
            const isUsed = usedOptions.has(option);
            return (
              <div
                key={option}
                draggable={!readOnly && !isUsed}
                onDragStart={(e) => handleDragStart(option, e)}
                onDragEnd={handleDragEnd}
                className={`px-3 py-1.5 text-sm border rounded transition-all ${
                  !readOnly && !isUsed ? "cursor-move" : "cursor-default"
                } ${
                  isUsed
                    ? "bg-gray-50 border-gray-200 text-gray-400"
                    : "bg-white border-gray-300 text-gray-700 hover:border-slate-300 hover:bg-slate-50"
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

