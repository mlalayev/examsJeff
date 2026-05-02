"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Eye } from "lucide-react";
import { sanitizeHtmlCssMarkup } from "@/lib/htmlCssAnswerKey";

interface QHtmlCssProps {
  question: {
    id: string;
    prompt?: {
      text?: string;
      htmlCode?: string;
      cssCode?: string;
    };
  };
  value: any;
  onChange: (value: any) => void;
  readOnly: boolean;
}

/** Push answer map into iframe fields (no listener churn). */
function applyAnswersToIframeDoc(
  iframeDoc: Document,
  answers: Record<string, any>
) {
  const allInputs = iframeDoc.querySelectorAll("input, textarea, select");
  allInputs.forEach((el: Element) => {
    const node = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const key = node.name || node.id;
    if (!key) return;
    if (answers[key] === undefined) return;
    if (node.type === "checkbox") {
      node.checked = answers[key] === true || answers[key] === "true";
    } else if (node.type === "radio") {
      node.checked = answers[key] === node.value;
    } else {
      node.value = String(answers[key] ?? "");
    }
  });
}

export default function QHtmlCss({ question, value, onChange, readOnly }: QHtmlCssProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>(value || {});
  const studentAnswersRef = useRef(studentAnswers);
  studentAnswersRef.current = studentAnswers;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const flushParentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingParentFlushRef = useRef<Record<string, any> | null>(null);

  // Debounce parent updates so rapid iframe events do not re-render the whole exam tree every tick
  const scheduleParentFlush = useCallback((next: Record<string, any>) => {
    pendingParentFlushRef.current = next;
    if (flushParentTimerRef.current) {
      clearTimeout(flushParentTimerRef.current);
    }
    flushParentTimerRef.current = setTimeout(() => {
      flushParentTimerRef.current = null;
      const payload = pendingParentFlushRef.current;
      pendingParentFlushRef.current = null;
      const v = onChangeRef.current;
      if (typeof v === "function" && payload) v(payload);
    }, 120);
  }, []);

  // Keep local state in sync when parent `value` changes (e.g. load / reset)
  useEffect(() => {
    const next = value || {};
    setStudentAnswers((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, [value]);

  // Bind iframe once per question markup — NOT on every `studentAnswers` change (that froze the page)
  useEffect(() => {
    if (!iframeRef.current || readOnly) return;

    const iframe = iframeRef.current;
    let cancelled = false;

    const setupListeners = (): number => {
      if (cancelled) return 0;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return 0;

        applyAnswersToIframeDoc(iframeDoc, studentAnswersRef.current);

        const allInputs = iframeDoc.querySelectorAll("input, textarea, select");
        if (allInputs.length === 0) return 0;

        const handler = (e: Event) => {
          const t = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
          if (!t) return;
          const tag = (t.tagName || "").toLowerCase();
          if (tag !== "input" && tag !== "textarea" && tag !== "select") return;

          const key = t.name || t.id;
          if (!key) return;

          let answerValue: string | boolean;
          if (t.type === "checkbox") {
            answerValue = !!t.checked;
          } else if (t.type === "radio") {
            if (!t.checked) return;
            answerValue = t.value;
          } else {
            answerValue = t.value;
          }

          setStudentAnswers((prev) => {
            if (prev[key] === answerValue) return prev;
            const merged = { ...prev, [key]: answerValue };
            scheduleParentFlush(merged);
            return merged;
          });
        };

        iframeDoc.addEventListener("input", handler, true);
        iframeDoc.addEventListener("change", handler, true);

        const poll = () => {
          if (cancelled) return;
          try {
            const next: Record<string, any> = {};
            const nodes = iframeDoc.querySelectorAll("input, textarea, select");
            nodes.forEach((el: Element) => {
              const node = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
              const key = node.name || node.id;
              if (!key) return;
              if (node.type === "radio") {
                if (node.checked) next[key] = node.value;
                return;
              }
              if (node.type === "checkbox") {
                next[key] = !!node.checked;
                return;
              }
              next[key] = node.value;
            });

            setStudentAnswers((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
              scheduleParentFlush(next);
              return next;
            });
          } catch {
            /* ignore */
          }
        };
        const intervalId = window.setInterval(poll, 800);

        (iframe as unknown as { __htmlCssCleanup?: () => void }).__htmlCssCleanup = () => {
          try {
            iframeDoc.removeEventListener("input", handler, true);
            iframeDoc.removeEventListener("change", handler, true);
            window.clearInterval(intervalId);
          } catch {
            /* ignore */
          }
        };
        return allInputs.length;
      } catch (e) {
        console.error("Error setting up iframe listeners:", e);
        return 0;
      }
    };

    const trySetupWithRetry = (attempt: number) => {
      if (cancelled) return;
      const boundCount = setupListeners();
      if (boundCount > 0) {
        return;
      }
      if (attempt >= 20) {
        console.error("❌ Failed to find inputs after 20 attempts (~2 seconds)");
        return;
      }
      window.setTimeout(() => {
        if (cancelled) return;
        trySetupWithRetry(attempt + 1);
      }, 100);
    };

    const onLoad = () => {
      window.setTimeout(() => {
        if (cancelled) return;
        trySetupWithRetry(0);
      }, 0);
    };

    iframe.addEventListener("load", onLoad);
    onLoad();

    return () => {
      cancelled = true;
      if (flushParentTimerRef.current) {
        clearTimeout(flushParentTimerRef.current);
        flushParentTimerRef.current = null;
      }
      if (pendingParentFlushRef.current) {
        const v = onChangeRef.current;
        if (typeof v === "function") v(pendingParentFlushRef.current);
        pendingParentFlushRef.current = null;
      }
      try {
        (iframe as unknown as { __htmlCssCleanup?: () => void }).__htmlCssCleanup?.();
      } catch {
        /* ignore */
      }
      iframe.removeEventListener("load", onLoad);
    };
  }, [question.prompt?.htmlCode, question.prompt?.cssCode, readOnly, scheduleParentFlush]);

  // When parent sends new `value` while iframe already mounted, patch DOM only (no listener teardown)
  useEffect(() => {
    if (readOnly) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    applyAnswersToIframeDoc(doc, value || {});
  }, [value, readOnly]);

  const renderInteractiveHTML = () => {
    const htmlCode = sanitizeHtmlCssMarkup(question.prompt?.htmlCode || "");
    const cssCode = question.prompt?.cssCode || "";

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
      </html>
    `;

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Interactive Question</span>
          </div>
        </div>
        <div className="p-4 bg-white min-h-0">
          <iframe
            ref={iframeRef}
            srcDoc={fullHtml}
            title="Interactive HTML Question"
            className="w-full min-h-[560px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[min(80vh,880px)] border-0"
            sandbox="allow-same-origin"
          />
        </div>
        {!readOnly && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700">
              Fill in the form above. Your answers are automatically saved.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {question.prompt?.text && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">
            {question.prompt.text}
          </p>
        </div>
      )}

      {renderInteractiveHTML()}
    </div>
  );
}
