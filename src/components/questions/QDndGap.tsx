"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";
import { useMemo, useState } from "react";

export function QDndGap({ question, value, onChange, readOnly, showWordBank = true, externalDraggedOption = null, onDropComplete }: BaseQuestionProps<Record<string, string>> & { showWordBank?: boolean; externalDraggedOption?: string | null; onDropComplete?: () => void }) {
  const imageUrl = question.prompt?.imageUrl;
  let sentences: string[] = [];
  
  // Handle single sentence with blanks (for preposition/time expression questions)
  if (question.prompt?.text && question.prompt.text.includes('________')) {
    sentences = [question.prompt.text];
  } else if (question.prompt?.textWithBlanks) {
    const text = question.prompt.textWithBlanks;
    // If textWithBlanks contains only one sentence (no newlines, no numbered list), treat as single sentence
    if (!text.includes('\n') && !text.includes('1.') && !text.includes('2.')) {
      sentences = [text];
    } else if (text.includes('\n')) {
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
  
  // For single sentence rendering (when called from attempt runner with one sentence per question)
  const isSingleSentence = sentences.length === 1;

  // Get word bank from answerKey.blanks (auto-generated from correct answers)
  // If not available, fall back to options.bank for backward compatibility
  const rawOptions: string[] = question.answerKey?.blanks?.filter((b: string) => b && b.trim() !== "") 
    || question.options?.bank 
    || ["am", "is", "are"];

  // Support duplicates via shorthand like "am (2x)"
  type Chip = { id: string; label: string };
  const chips: Chip[] = useMemo(() => {
    const expanded: Chip[] = [];
    rawOptions.forEach((opt, idx) => {
      const m = opt.match(/^\s*(.+?)\s*\((\d+)x\)\s*$/i);
      if (m) {
        const label = m[1];
        const count = Math.max(1, parseInt(m[2], 10));
        for (let i = 0; i < count; i++) {
          expanded.push({ id: `${label}-${idx}-${i}`, label });
        }
      } else {
        expanded.push({ id: `${opt}-${idx}-0`, label: opt });
      }
    });
    // shuffle deterministically per mount
    for (let i = expanded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = expanded[i];
      expanded[i] = expanded[j];
      expanded[j] = t;
    }
    return expanded;
  }, [rawOptions]);

  // Value format: { "0": ["on", "at"], "1": ["in"] } (sentence index → array of answers for each blank)
  const currentAnswers = value || {};
  const [draggedOption, setDraggedOption] = useState<string | null>(null);

  const handleDrop = (sentenceIndex: number, blankIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    // Use external dragged option if available, otherwise use internal state
    const activeDraggedOption = externalDraggedOption || draggedOption;
    if (readOnly || !activeDraggedOption) return;
    
    const newAnswers = { ...currentAnswers };
    const sentenceAnswers = newAnswers[sentenceIndex.toString()] || [];
    
    // Ensure array exists and has enough space
    if (!Array.isArray(sentenceAnswers)) {
      newAnswers[sentenceIndex.toString()] = [];
    }
    
    // Set the answer for this specific blank
    const updatedSentenceAnswers = [...(Array.isArray(newAnswers[sentenceIndex.toString()]) ? newAnswers[sentenceIndex.toString()] : [])];
    updatedSentenceAnswers[blankIndex] = activeDraggedOption;
    newAnswers[sentenceIndex.toString()] = updatedSentenceAnswers;
    
    onChange(newAnswers);
    if (!externalDraggedOption) {
      setDraggedOption(null);
    } else {
      // If using external dragged option, notify parent to clear it
      if (onDropComplete) {
        onDropComplete();
      }
    }
  };

  const handleDragStart = (optionLabel: string, e: React.DragEvent) => {
    if (readOnly) return;
    setDraggedOption(optionLabel);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    setDraggedOption(null);
  };

  const removeAnswer = (sentenceIndex: number, blankIndex: number) => {
    if (readOnly) return;
    const newAnswers = { ...currentAnswers };
    const sentenceAnswers = newAnswers[sentenceIndex.toString()];
    
    if (Array.isArray(sentenceAnswers)) {
      sentenceAnswers[blankIndex] = undefined;
      newAnswers[sentenceIndex.toString()] = sentenceAnswers;
      onChange(newAnswers);
    }
  };

  // Check if an option is used in any sentence
  const isOptionUsed = (label: string) => {
    return Object.values(currentAnswers).some((sentenceAnswers: any) => {
      if (Array.isArray(sentenceAnswers)) {
        return sentenceAnswers.includes(label);
      }
      return false;
    });
  };

  // Render single sentence (for when each sentence is a separate question)
  const renderSingleSentence = (sentence: string, index: number = 0) => {
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    // Handle both ___ and ________ blanks
    const parts = cleanSentence.split(/___+|________+/);
    const sentenceAnswers = Array.isArray(currentAnswers[index.toString()]) ? currentAnswers[index.toString()] : [];
    
    return (
      <div className="space-y-3">
        <QuestionImage imageUrl={imageUrl} />
        <div className="space-y-4">
        {/* Sentence with blank(s) */}
        <div className="flex items-center space-x-1 flex-wrap">
          {parts.map((part, partIndex) => (
            <div key={partIndex} className="flex items-center space-x-1">
              <span className="text-gray-900 text-base leading-relaxed" style={{ lineHeight: '1.7' }}>{part}</span>
              {partIndex < parts.length - 1 && (
                <span
                  onDrop={(e) => handleDrop(index, partIndex, e)}
                  onDragOver={handleDragOver}
                  className={`relative inline-block min-w-[100px] px-3 py-2 rounded-lg border transition-all ${
                    !readOnly ? "cursor-pointer" : ""
                  }`}
                  style={sentenceAnswers[partIndex] ? {
                    borderColor: '#303380',
                    backgroundColor: '#303380',
                    color: 'white'
                  } : {
                    borderColor: 'rgba(48, 51, 128, 0.2)',
                    backgroundColor: 'rgba(48, 51, 128, 0.02)',
                    color: 'rgba(48, 51, 128, 0.6)',
                    borderStyle: 'dashed'
                  }}
                  onMouseEnter={(e) => {
                    if (!readOnly && !sentenceAnswers[partIndex]) {
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!readOnly && !sentenceAnswers[partIndex]) {
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                    }
                  }}
                >
                  {sentenceAnswers[partIndex] || (sentence.includes('________') ? "________" : "___")}
                  {sentenceAnswers[partIndex] && !readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAnswer(index, partIndex);
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
  

  // Render each sentence (without individual word banks) - for multiple sentences
  const renderSentence = (sentence: string, index: number) => {
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    // Handle both ___ and ________ blanks
    const parts = cleanSentence.split(/___+|________+/);
    const sentenceAnswers = Array.isArray(currentAnswers[index.toString()]) ? currentAnswers[index.toString()] : [];
    
    return (
      <div key={index} className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
               style={{
                 backgroundColor: '#303380',
                 color: 'white'
               }}>
            {index + 1}
          </div>
          <div className="flex items-center space-x-1 flex-wrap flex-1">
            {parts.map((part, partIndex) => (
              <div key={partIndex} className="flex items-center space-x-1">
                <span className="text-gray-900 text-base leading-relaxed" style={{ lineHeight: '1.7' }}>{part}</span>
                {partIndex < parts.length - 1 && (
                  <span
                    onDrop={(e) => handleDrop(index, partIndex, e)}
                    onDragOver={handleDragOver}
                    className={`relative inline-block min-w-[100px] px-3 py-2 rounded-lg border transition-all ${
                      !readOnly ? "cursor-pointer" : ""
                    }`}
                    style={sentenceAnswers[partIndex] ? {
                      borderColor: '#303380',
                      backgroundColor: '#303380',
                      color: 'white'
                    } : {
                      borderColor: 'rgba(48, 51, 128, 0.2)',
                      backgroundColor: 'rgba(48, 51, 128, 0.02)',
                      color: 'rgba(48, 51, 128, 0.6)',
                      borderStyle: 'dashed'
                    }}
                    onMouseEnter={(e) => {
                      if (!readOnly && !sentenceAnswers[partIndex]) {
                        e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!readOnly && !sentenceAnswers[partIndex]) {
                        e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                        e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                      }
                    }}
                  >
                    {sentenceAnswers[partIndex] || (sentence.includes('________') ? "________" : "___")}
                    {sentenceAnswers[partIndex] && !readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnswer(index, partIndex);
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

  // If single sentence, render it without the number badge (number is shown by parent)
  if (isSingleSentence) {
    return renderSingleSentence(sentences[0], 0);
  }

  // Multiple sentences - render all with word bank at the end
  return (
    <div className="space-y-4">
      {/* All sentences */}
      <div className="space-y-2">
        {sentences.map((sentence: string, index: number) => renderSentence(sentence, index))}
      </div>
      
      {/* Single Word Bank for all sentences */}
      {showWordBank && (
        <div className="border-t pt-4 mt-6"
             style={{ borderColor: 'rgba(48, 51, 128, 0.1)' }}>
          <h4 className="text-xs font-medium mb-3 uppercase tracking-wide"
              style={{ color: 'rgba(48, 51, 128, 0.7)' }}>Word Bank</h4>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const used = isOptionUsed(chip.label);
              return (
                <div
                  key={chip.id}
                  draggable={!readOnly && !used}
                  onDragStart={(e) => handleDragStart(chip.label, e)}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    !readOnly && !used ? "cursor-move" : "cursor-default"
                  }`}
                  style={used ? {
                    backgroundColor: 'rgba(48, 51, 128, 0.05)',
                    borderColor: 'rgba(48, 51, 128, 0.1)',
                    color: 'rgba(48, 51, 128, 0.4)'
                  } : {
                    backgroundColor: 'rgba(48, 51, 128, 0.02)',
                    borderColor: 'rgba(48, 51, 128, 0.15)',
                    color: '#303380'
                  }}
                  onMouseEnter={(e) => {
                    if (!readOnly && !used) {
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!readOnly && !used) {
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                    }
                  }}
                >
                  {chip.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}