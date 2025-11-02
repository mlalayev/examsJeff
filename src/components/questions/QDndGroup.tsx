"use client";

import { useMemo, useState, useRef } from "react";

interface QuestionLike {
  id: string;
  prompt: any;
  answerKey: any;
  options?: { bank?: string[] };
}

interface QDndGroupProps {
  questions: QuestionLike[];
  values: Record<string, any>;
  onChange: (questionId: string, value: any) => void;
  readOnly?: boolean;
}

export default function QDndGroup({ questions, values, onChange, readOnly }: QDndGroupProps) {
  const questionsRef = useRef<HTMLDivElement>(null);
  
  // Extract sentences (one blank per question expected)
  const sentences = useMemo(() => {
    return questions.map((q) => String(q.prompt?.text || "")).map((s) => s.trim());
  }, [questions]);
  
  const scrollToTop = () => {
    if (questionsRef.current) {
      const element = questionsRef.current;
      
      // Find the scrollable parent container (the one with overflow-y-auto)
      let scrollContainer: HTMLElement | null = element.parentElement;
      while (scrollContainer && scrollContainer !== document.body) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
            scrollContainer.classList.contains('overflow-y-auto') ||
            scrollContainer.classList.contains('custom-scrollbar')) {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }
      
      if (scrollContainer) {
        // Scroll within the container
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = elementRect.top - containerRect.top + scrollContainer.scrollTop - 20; // 20px offset
        
        scrollContainer.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      } else {
        // Fallback: scroll window
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: scrollTop + rect.top - 20,
          behavior: 'smooth'
        });
      }
    }
  };

  // Build chip counts from word bank if available, otherwise from answers
  type Chip = { id: string; label: string };
  const chips: Chip[] = useMemo(() => {
    // Check if any question has a word bank (options.bank)
    const hasWordBank = questions.some(q => q.options?.bank && Array.isArray(q.options.bank) && q.options.bank.length > 0);
    
    if (hasWordBank) {
      // Use word bank from the first question that has it (they should all have the same bank)
      const wordBank = questions.find(q => q.options?.bank)?.options?.bank || [];
      const expanded: Chip[] = [];
      wordBank.forEach((label: string, idx: number) => {
        expanded.push({ id: `${label}-${idx}`, label: String(label) });
      });
      
      // Shuffle once per mount
      for (let i = expanded.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = expanded[i];
        expanded[i] = expanded[j];
        expanded[j] = t;
      }
      return expanded;
    }
    
    // Otherwise, use the old logic: build from answers
    const counts: Record<string, number> = {};
    questions.forEach((q, idx) => {
      const answers: string[] = Array.isArray(q.answerKey?.answers)
        ? q.answerKey.answers
        : (q.answerKey ? [q.answerKey] : []);
      const label = String(answers?.[0] || "").trim();
      if (!label) return;
      counts[label] = (counts[label] || 0) + 1;
    });

    const expanded: Chip[] = [];
    Object.entries(counts).forEach(([label, count], gi) => {
      for (let i = 0; i < count; i++) {
        expanded.push({ id: `${label}-${gi}-${i}`, label });
      }
    });

    // Shuffle once per mount
    for (let i = expanded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = expanded[i];
      expanded[i] = expanded[j];
      expanded[j] = t;
    }
    return expanded;
  }, [questions]);

  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);

  // Compute used counts by label from current values
  const usedCountByLabel = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(values || {}).forEach((val) => {
      // DND_GAP values are arrays
      const labels = Array.isArray(val) ? val : [val];
      labels.forEach((label) => {
        if (!label) return;
        counts[label as string] = (counts[label as string] || 0) + 1;
      });
    });
    return counts;
  }, [values]);

  const handleDrop = (questionId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly || !draggedLabel) return;
    // DND_GAP expects an array of answers (even for single blank)
    onChange(questionId, [draggedLabel]);
    setDraggedLabel(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const removeAnswer = (questionId: string) => {
    if (readOnly) return;
    // Clear answer (set to empty array for DND_GAP)
    onChange(questionId, []);
  };

  return (
    <div className="space-y-6">
      {/* Sentences list */}
      <div ref={questionsRef} className="space-y-2">
        {questions.map((q, idx) => {
          const sentence = sentences[idx] || "";
          const parts = sentence.split(/___+|________+/);
          // DND_GAP value is an array, get first element for single blank
          const valueArray = values?.[q.id];
          const value = Array.isArray(valueArray) ? valueArray[0] : valueArray;
          return (
            <div key={q.id} className="group mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm"
                     style={{
                       backgroundColor: '#303380',
                       color: 'white'
                     }}>
                  {idx + 1}
                </div>
                <div className="flex items-center space-x-1 flex-wrap flex-1" style={{ lineHeight: '1.7' }}>
                  {parts.map((part, pIdx) => (
                    <div key={pIdx} className="flex items-center space-x-1">
                      <span className="text-gray-900 text-base">{part}</span>
                      {pIdx < parts.length - 1 && (
                        <span
                          onDrop={(e) => handleDrop(q.id, e)}
                          onDragOver={handleDragOver}
                          className={`relative inline-block min-w-[80px] px-3 py-1 rounded-lg border transition-all ${!readOnly ? "cursor-pointer" : ""}`}
                          style={value ? {
                            borderColor: '#303380',
                            backgroundColor: '#303380',
                            color: 'white'
                          } : {
                            borderColor: 'rgba(48, 51, 128, 0.2)',
                            backgroundColor: 'rgba(48, 51, 128, 0.02)',
                            color: 'rgba(48, 51, 128, 0.6)',
                            borderStyle: 'dashed'
                          }}
                        >
                          {value || (sentence.includes('________') ? '________' : '___')}
                          {value && !readOnly && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeAnswer(q.id); }}
                              className="ml-2 text-white/70 hover:text-white text-xs"
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
        })}
      </div>

      {/* Options */}
      <div className="border-t pt-4" style={{ borderColor: 'rgba(48, 51, 128, 0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(48, 51, 128, 0.7)' }}>Options</h4>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:shadow-sm"
            style={{
              backgroundColor: 'rgba(48, 51, 128, 0.08)',
              borderColor: 'rgba(48, 51, 128, 0.15)',
              color: '#303380',
              border: '1px solid'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(48, 51, 128, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(48, 51, 128, 0.15)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2.33333L7 11.6667M7 2.33333L3.5 5.83333M7 2.33333L10.5 5.83333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Scroll to questions</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const seenPerLabel: Record<string, number> = {};
            return chips.map((chip) => {
              const seen = seenPerLabel[chip.label] || 0;
              const used = usedCountByLabel[chip.label] || 0;
              const isUsed = seen < used ? (seenPerLabel[chip.label] = seen + 1, true) : false;
              return (
                <div
                  key={chip.id}
                  draggable={!readOnly && !isUsed}
                  onDragStart={(e) => { if (!isUsed && !readOnly) { setDraggedLabel(chip.label); e.dataTransfer.effectAllowed = 'move'; } }}
                  onDragEnd={() => setDraggedLabel(null)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${!readOnly && !isUsed ? 'cursor-move' : 'cursor-default'}`}
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


