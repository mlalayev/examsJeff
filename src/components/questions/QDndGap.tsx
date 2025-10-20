"use client";

import { BaseQuestionProps } from "./types";
import { useMemo, useState } from "react";

export function QDndGap({ question, value, onChange, readOnly }: BaseQuestionProps<Record<string, string>>) {
  let sentences: string[] = [];
  
  // Handle single sentence with blanks (for preposition/time expression questions)
  if (question.prompt?.text && question.prompt.text.includes('________')) {
    sentences = [question.prompt.text];
  } else if (question.prompt?.textWithBlanks) {
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

  // Generate options for preposition/time expression questions
  let rawOptions: string[] = [];
  if (question.prompt?.text && (question.prompt.text.includes('preposition') || question.prompt.text.includes('time expression'))) {
    // Common prepositions and time expressions
    rawOptions = ["in", "on", "at", "when", "ago", "next", "last", "before", "after", "during", "for", "since", "until", "by", "from", "to"];
  } else {
    rawOptions = question.options?.bank || ["am", "is", "are"];
  }

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

  const currentAnswers = value || {};
  const [draggedOption, setDraggedOption] = useState<string | null>(null); // stores label

  // Build used counts per label from current answers
  const usedCountByLabel: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(currentAnswers).forEach((label) => {
      if (!label) return;
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }, [currentAnswers]);

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

  const removeAnswer = (gapKey: string) => {
    if (readOnly) return;
    const newAnswers = { ...currentAnswers };
    delete newAnswers[gapKey];
    onChange(newAnswers);
  };

  const renderSentence = (sentence: string, index: number) => {
    const cleanSentence = sentence.replace(/^\d+\.\s*/, '').trim();
    // Handle both ___ and ________ blanks
    const parts = cleanSentence.split(/___+|________+/);
    
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
                    className={`relative inline-block min-w-[80px] px-3 py-1 rounded-lg border group/gap transition-all ${
                      !readOnly ? "cursor-pointer" : ""
                    }`}
                    style={currentAnswers[`${index}-${partIndex}`] ? {
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
                      if (!readOnly && !currentAnswers[`${index}-${partIndex}`]) {
                        e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!readOnly && !currentAnswers[`${index}-${partIndex}`]) {
                        e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                        e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                      }
                    }}
                  >
                    {currentAnswers[`${index}-${partIndex}`] || (sentence.includes('________') ? "________" : "___")}
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
      
      <div className="border-t pt-4"
           style={{ borderColor: 'rgba(48, 51, 128, 0.1)' }}>
        <h4 className="text-xs font-medium mb-3 uppercase tracking-wide"
            style={{ color: 'rgba(48, 51, 128, 0.7)' }}>Options</h4>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const seenForLabel: Record<string, number> = {};
            return chips.map((chip) => {
              const seen = seenForLabel[chip.label] || 0;
              const usedTotal = usedCountByLabel[chip.label] || 0;
              const isUsed = seen < usedTotal ? (seenForLabel[chip.label] = seen + 1, true) : false;
              return (
                <div
                  key={chip.id}
                  draggable={!readOnly && !isUsed}
                  onDragStart={(e) => handleDragStart(chip.label, e)}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    !readOnly && !isUsed ? "cursor-move" : "cursor-default"
                  }`}
                  style={isUsed ? {
                  backgroundColor: 'rgba(48, 51, 128, 0.05)',
                  borderColor: 'rgba(48, 51, 128, 0.1)',
                  color: 'rgba(48, 51, 128, 0.4)'
                  } : {
                  backgroundColor: 'rgba(48, 51, 128, 0.02)',
                  borderColor: 'rgba(48, 51, 128, 0.15)',
                  color: '#303380'
                  }}
                  onMouseEnter={(e) => {
                    if (!readOnly && !isUsed) {
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!readOnly && !isUsed) {
                      e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
                    }
                  }}
                >
                  {chip.label}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}