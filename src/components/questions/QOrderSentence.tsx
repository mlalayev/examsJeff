"use client";

import { BaseQuestionProps } from "./types";
import { useState, useEffect } from "react";

export function QOrderSentence({ question, value, onChange, readOnly }: BaseQuestionProps<number[]>) {
  const tokens = Array.isArray(question.prompt?.tokens) ? question.prompt.tokens : [];
  const correctOrder = Array.isArray(value) ? value : tokens.map((_, idx) => idx);
  
  // Shuffle tokens for display (only on mount, or if value is empty)
  const [displayOrder, setDisplayOrder] = useState<number[]>(() => {
    if (readOnly && correctOrder.length === tokens.length) {
      return correctOrder;
    }
    // Shuffle indices
    const shuffled = [...Array(tokens.length).keys()].sort(() => Math.random() - 0.5);
    return shuffled;
  });

  useEffect(() => {
    if (readOnly && correctOrder.length === tokens.length) {
      setDisplayOrder(correctOrder);
    }
  }, [readOnly, correctOrder, tokens.length]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (readOnly) return;
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    
    if (draggedIndex === targetIndex) return;
    
    const newOrder = [...displayOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    setDisplayOrder(newOrder);
    onChange(newOrder);
  };

  if (tokens.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        No tokens available for this question.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Drag and drop the items below to arrange them in the correct order.
      </p>
      <div className="flex flex-wrap gap-2">
        {displayOrder.map((tokenIndex, displayIdx) => {
          const token = tokens[tokenIndex];
          return (
            <div
              key={`${tokenIndex}-${displayIdx}`}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, displayIdx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, displayIdx)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                readOnly
                  ? "bg-gray-50 border-gray-200 cursor-default"
                  : "bg-white border-gray-200 hover:border-gray-300 cursor-move hover:shadow-md"
              }`}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-semibold text-xs"
                   style={{
                     backgroundColor: '#303380',
                     color: 'white'
                   }}>
                {displayIdx + 1}
              </div>
              <span className="text-base text-gray-900 whitespace-nowrap">
                {token}
              </span>
              {!readOnly && (
                <div className="flex-shrink-0 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


