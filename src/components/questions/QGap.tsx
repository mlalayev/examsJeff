"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  const sentences = question.prompt?.sentences || [];
  const options = question.prompt?.options || [];
  
  const currentAnswers = value || {};
  const [draggedOption, setDraggedOption] = useState<string | null>(null);
  const [usedOptions, setUsedOptions] = useState<Set<string>>(new Set(Object.values(currentAnswers)));
  const [optionsAtTop, setOptionsAtTop] = useState(false); // whether options are shown at the top

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
        <div className="flex items-start space-x-2 text-sm">
          <span className="flex-shrink-0 text-gray-500 font-medium">{index + 1}.</span>
          <span className="text-gray-900 flex-1">
            {parts[0]}
            <span
              onDrop={(e) => handleDrop(index, e)}
              onDragOver={handleDragOver}
              className={`inline-block min-w-[80px] px-3 py-1 mx-1 rounded-lg border ${
                answer 
                  ? "border-gray-900 bg-gray-900 text-white font-medium" 
                  : "border-gray-200 bg-gray-50 text-gray-400 border-dashed"
              } ${!readOnly ? "cursor-pointer hover:border-gray-400" : ""}`}
            >
              {answer || "___"}
            </span>
            {parts[1]}
            {answer && !readOnly && (
              <button
                onClick={() => removeAnswer(index)}
                className="ml-2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </span>
        </div>
      </div>
    );
  };

  const renderOptions = () => {
    return (
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Options</h4>
        <div className="flex items-start gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
          {options.map((option: string) => {
            const isUsed = usedOptions.has(option);
            return (
              <div
                key={option}
                draggable={!readOnly && !isUsed}
                onDragStart={(e) => handleDragStart(option, e)}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  isUsed
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-700 cursor-move hover:border-gray-900 hover:bg-gray-50"
                }`}
              >
                {option}
              </div>
            );
          })}
          </div>
          <button
            onClick={() => setOptionsAtTop(!optionsAtTop)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-gray-50 border-gray-200 text-gray-600 flex-shrink-0"
            aria-label={optionsAtTop ? "Move options down" : "Move options up"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-4 h-4"
              style={{ transform: optionsAtTop ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {optionsAtTop && renderOptions()}
      
      <div className="space-y-2">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      {!optionsAtTop && renderOptions()}
    </div>
  );
}