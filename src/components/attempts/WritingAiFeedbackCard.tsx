"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { parseWritingFeedback } from "@/lib/parse-writing-feedback";

interface WritingAiFeedbackCardProps {
  feedback: string;
}

/**
 * Renders AI writing feedback with a structured word-count strip (Lucide icons)
 * and body text. Supports legacy feedback that still starts with ✅ / ⚠️.
 */
export function WritingAiFeedbackCard({ feedback }: WritingAiFeedbackCardProps) {
  const { wordCountLine, status, body } = parseWritingFeedback(feedback);
  const hasWordCount = Boolean(wordCountLine && status);
  const wcLabel =
    wordCountLine && /^Word count:/i.test(wordCountLine.trim())
      ? "Word count"
      : "Söz sayısı";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 border-l-4 border-l-[#303380] bg-white shadow-sm ring-1 ring-slate-950/[0.03]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/95 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#303380]" aria-hidden />
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            AI Feedback
          </h4>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        {hasWordCount && wordCountLine && status && (
          <div
            className={
              status === "ok"
                ? "mb-4 flex gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5"
                : "mb-4 flex gap-3 rounded-lg border border-rose-200/80 bg-rose-50/70 px-3 py-2.5"
            }
            role="status"
          >
            <div
              className={
                status === "ok"
                  ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-700"
                  : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100/90 text-rose-700"
              }
            >
              {status === "ok" ? (
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              ) : (
                <XCircle className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {wcLabel}
              </p>
              <p
                className={
                  status === "ok"
                    ? "text-sm font-medium leading-snug text-emerald-950"
                    : "text-sm font-medium leading-snug text-rose-950"
                }
              >
                {wordCountLine}
              </p>
            </div>
          </div>
        )}

        {body ? (
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{body}</p>
        ) : !hasWordCount ? (
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{feedback}</p>
        ) : null}
      </div>
    </div>
  );
}
