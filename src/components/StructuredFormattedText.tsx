"use client";

import React from "react";
import { parseStructuredTextBlocks } from "@/lib/text-formatter";
import FormattedText from "@/components/FormattedText";

type Props = {
  text: string;
  className?: string;
  /** If true, show the question column (right). */
  showQuestion?: boolean;
};

export function StructuredFormattedText({
  text,
  className = "",
  showQuestion = true,
}: Props) {
  const blocks = parseStructuredTextBlocks(text);
  if (!blocks) {
    return (
      <div className={className}>
        <FormattedText text={text} />
      </div>
    );
  }

  const hasIntro = Boolean(blocks.intro);
  const hasText = Boolean(blocks.text);
  const hasQuestion = Boolean(blocks.question) && showQuestion;

  return (
    <div className={className}>
      {hasIntro && (
        <div className="text-sm italic text-slate-600 mb-3">
          <FormattedText text={blocks.intro} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="min-w-0">
          {hasText ? (
            <div className="text-[15px] leading-relaxed text-slate-800">
              <FormattedText text={blocks.text} />
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">No [text] block.</div>
          )}
        </div>

        {showQuestion && (
          <div className="min-w-0">
            {hasQuestion ? (
              <div className="text-[15px] leading-relaxed text-slate-900">
                <FormattedText text={blocks.question} />
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">No [question] block.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

