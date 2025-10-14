"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export function QDndGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  // Simple approach - just use the text as is and split by common patterns
  let sentences = [];
  
  if (question.prompt?.textWithBlanks) {
    const text = question.prompt.textWithBlanks;
    // Try multiple splitting strategies
    if (text.includes('\n')) {
      sentences = text.split('\n').filter((line: string) => line.trim());
    } else if (text.includes('1.') && text.includes('2.')) {
      // Split by number patterns
      sentences = text.split(/(?=\d+\.\s)/).filter((line: string) => line.trim());
    } else {
      // If it's one long string, try to split by common sentence endings
      sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter((line: string) => line.trim());
    }
  } else if (question.prompt?.sentences) {
    sentences = question.prompt.sentences;
  } else {
    // Fallback: create sample sentences for testing
    sentences = [
      "I ___ running.",
      "You ___ playing.",
      "He ___ reading."
    ];
  }
  
  const options = question.options?.bank || ["am", "is", "are"];
  
  // Initialize value as object with sentence indices as keys
  const currentAnswers = value || {};
  
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  // Calculate used options from current answers
  const usedOptions = new Set(Object.values(currentAnswers));

  const handleDrop = (sentenceIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !draggedOption) return;
    
    const newAnswers = { ...currentAnswers };
    
    // Check if this option is already used elsewhere
    const existingIndex = Object.keys(newAnswers).find(key => 
      newAnswers[key] === draggedOption && key !== sentenceIndex.toString()
    );
    
    if (existingIndex) {
      // Remove the option from the existing position
      delete newAnswers[existingIndex];
    }
    
    newAnswers[sentenceIndex] = draggedOption;
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

  const removeAnswer = (sentenceIndex: number) => {
    if (readOnly) return;
    const newAnswers = { ...currentAnswers };
    delete newAnswers[sentenceIndex];
    onChange(newAnswers);
  };

  const renderSentence = (sentence: string, index: number) => {
    // Clean the sentence - remove leading numbers and dots
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    const parts = cleanSentence.split('___');
    const answer = currentAnswers[index];
    
    return (
      <div key={index} className="mb-6 group">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-600">{index + 1}.</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-800">{parts[0]}</span>
            <span
              onDrop={(e) => handleDrop(index, e)}
              onDragOver={handleDragOver}
              className={`relative inline-block min-w-[80px] h-8 border-2 border-dashed rounded px-2 py-1 ${
                answer 
                  ? "border-green-300 bg-green-50 text-green-800" 
                  : "border-slate-300 bg-slate-50 text-slate-500"
              } ${!readOnly ? "cursor-pointer hover:border-blue-400" : ""}`}
            >
              {answer || "___"}
              {answer && !readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAnswer(index);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              )}
            </span>
            <span className="text-slate-800">{parts[1]}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sentences */}
      <div>
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
                onDragEnd={handleDragEnd}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  !readOnly && !isUsed ? "cursor-move" : "cursor-default"
                } ${
                  isUsed
                    ? "bg-slate-100 border-slate-200 text-slate-400 opacity-50"
                    : "bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:shadow-md"
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

