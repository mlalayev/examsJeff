"use client";

import { Question } from "../../../types";

interface PromptDndGapProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptDndGap({ question, onChange }: PromptDndGapProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Sentences (one per line, use ___ or ________ for each blank)
        </label>
        <textarea
          value={question.prompt?.textWithBlanks || ""}
          onChange={(e) => {
            const textWithBlanks = e.target.value;
            // Split by newlines to get sentences
            const sentences = textWithBlanks.split('\n').filter(line => line.trim());

            // Count total blanks across all sentences
            let totalBlanks = 0;
            sentences.forEach(sentence => {
              const blanksInSentence = sentence.split(/___+|________+/).length - 1;
              totalBlanks += blanksInSentence;
            });

            // Initialize blanks array with existing values or empty strings
            const currentBlanks = Array.isArray(question.answerKey?.blanks)
              ? question.answerKey.blanks
              : [];
            const newBlanks = Array(totalBlanks).fill("").map((_, idx) => currentBlanks[idx] || "");

            // Auto-generate word bank from answers
            const wordBank = newBlanks.filter(b => b.trim() !== "");

            onChange({
              ...question,
              prompt: { textWithBlanks: textWithBlanks },
              answerKey: { blanks: newBlanks },
              options: { bank: wordBank }, // Auto-generate word bank from answers
            });
          }}
          placeholder="I ___ running.&#10;She ___ to school every day.&#10;___ this day, ___ the weekend I want to go cinema."
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white resize-y"
          rows={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter one sentence per line. Each sentence can have multiple ___ blanks.
        </p>
      </div>

      {/* Show answer inputs for each blank in each sentence */}
      {(question.prompt?.textWithBlanks || "").split('\n').filter((line: string) => line.trim()).length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Correct Answers (one per blank)
          </label>
          <div className="space-y-3">
            {(() => {
              const sentences = (question.prompt?.textWithBlanks || "")
                .split('\n')
                .filter((line: string) => line.trim());

              let blankIndex = 0;
              return sentences.map((sentence: string, sentenceIdx: number) => {
                const blanksInSentence = sentence.split(/___+|________+/).length - 1;
                const blanksForThisSentence = [];

                for (let i = 0; i < blanksInSentence; i++) {
                  blanksForThisSentence.push(blankIndex);
                  blankIndex++;
                }

                return (
                  <div key={sentenceIdx} className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded bg-white flex items-center justify-center text-xs font-medium text-gray-700 mt-1">
                        {sentenceIdx + 1}
                      </div>
                      <div className="flex-1 text-xs text-gray-700 bg-white p-2 rounded">
                        {sentence.trim()}
                      </div>
                    </div>
                    {blanksForThisSentence.map((globalBlankIdx, localBlankIdx) => (
                      <div key={globalBlankIdx} className="flex items-center gap-2 ml-8">
                        <span className="text-xs text-gray-500 w-20">Blank {localBlankIdx + 1}:</span>
                        <input
                          type="text"
                          value={Array.isArray(question.answerKey?.blanks)
                            ? question.answerKey.blanks[globalBlankIdx] || ""
                            : ""}
                          onChange={(e) => {
                            const blanks = [...(question.answerKey?.blanks || [])];
                            blanks[globalBlankIdx] = e.target.value;
                            // Auto-generate word bank from all answers
                            const wordBank = blanks.filter(b => b && b.trim() !== "");

                            onChange({
                              ...question,
                              answerKey: { blanks },
                              options: { bank: wordBank }, // Auto-generate word bank
                            });
                          }}
                          placeholder={`Answer for blank ${localBlankIdx + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
