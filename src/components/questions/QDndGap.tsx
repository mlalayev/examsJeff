"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QDndGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  let sentences: string[] = [];
  
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
      "She ___ to school every day.",
      "They ___ playing football."
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
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    const parts = cleanSentence.split('___');
    
    return (
      <div key={index} className="mb-3 group">
        <div className="flex items-start space-x-2 text-sm">
          <span className="flex-shrink-0 font-medium text-gray-500">{index + 1}.</span>
          <div className="flex items-center space-x-1 flex-wrap flex-1">
            {parts.map((part, partIndex) => (
              <div key={partIndex} className="flex items-center space-x-1">
                <span className="text-gray-900">{part}</span>
                {partIndex < parts.length - 1 && (
                  <span
                    onDrop={(e) => handleDrop(`${index}-${partIndex}`, e)}
                    onDragOver={handleDragOver}
                    className={`relative inline-block min-w-[80px] px-3 py-1 rounded-lg border group/gap ${
                      currentAnswers[`${index}-${partIndex}`]
                        ? "border-gray-900 bg-gray-900 text-white font-medium" 
                        : "border-gray-200 bg-gray-50 text-gray-400 border-dashed"
                    } ${!readOnly ? "cursor-pointer hover:border-gray-400" : ""}`}
                  >
                    {currentAnswers[`${index}-${partIndex}`] || "___"}
                    {currentAnswers[`${index}-${partIndex}`] && !readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnswer(`${index}-${partIndex}`);
                        }}
                        className="ml-2 text-gray-300 hover:text-white text-xs"
                      >
                        ✕
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
    <div className="space-y-6">
      <div className="space-y-2">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Options</h4>
        <div className="flex flex-wrap gap-2">
          {options.map((option: string) => {
            const isUsed = usedOptions.has(option);
            return (
              <div
                key={option}
                draggable={!readOnly && !isUsed}
                onDragStart={(e) => handleDragStart(option, e)}
                onDragEnd={handleDragEnd}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  !readOnly && !isUsed ? "cursor-move" : "cursor-default"
                } ${
                  isUsed
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50"
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