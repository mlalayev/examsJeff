"use client";

import React, { useState, useEffect, useRef } from "react";
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

export default function QHtmlCss({ question, value, onChange, readOnly }: QHtmlCssProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, any>>(value || {});

  // Update parent when answers change
  useEffect(() => {
    if (JSON.stringify(studentAnswers) !== JSON.stringify(value)) {
      onChange(studentAnswers);
    }
  }, [studentAnswers, onChange, value]);

  // Inject event listeners into iframe
  useEffect(() => {
    if (!iframeRef.current || readOnly) return;

    const iframe = iframeRef.current;
    
    const setupListeners = (): number => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return 0;

        // Restore previous values (best effort)
        const allInputs = iframeDoc.querySelectorAll("input, textarea, select");
        allInputs.forEach((el: any) => {
          const key = el.name || el.id;
          if (!key) {
            return;
          }
          if (studentAnswers[key] === undefined) return;
          if (el.type === "checkbox") {
            el.checked = studentAnswers[key] === true || studentAnswers[key] === "true";
          } else if (el.type === "radio") {
            el.checked = studentAnswers[key] === el.value;
          } else {
            el.value = studentAnswers[key];
          }
        });

        // If there is nothing to bind to, caller can retry after load settles.
        if (allInputs.length === 0) return 0;

        // Event delegation (more reliable than per-element listeners)
        const handler = (e: Event) => {
          const t = e.target as any;
          if (!t) return;
          const tag = (t.tagName || "").toLowerCase();
          if (tag !== "input" && tag !== "textarea" && tag !== "select") return;

          const key = t.name || t.id;
          if (!key) return;

          let answerValue: any;
          if (t.type === "checkbox") {
            answerValue = !!t.checked;
          } else if (t.type === "radio") {
            if (!t.checked) return;
            answerValue = t.value;
          } else {
            answerValue = t.value;
          }

          setStudentAnswers((prev) => ({ ...prev, [key]: answerValue }));
        };

        iframeDoc.addEventListener("input", handler, true);
        iframeDoc.addEventListener("change", handler, true);

        // Fallback: poll values (some browsers/iframes can drop events)
        const poll = () => {
          try {
            const next: Record<string, any> = {};
            const nodes = iframeDoc.querySelectorAll("input, textarea, select");
            nodes.forEach((el: any) => {
              const key = el.name || el.id;
              if (!key) return;
              if (el.type === "radio") {
                if (el.checked) next[key] = el.value;
                return;
              }
              if (el.type === "checkbox") {
                next[key] = !!el.checked;
                return;
              }
              // Always capture the value, even if empty (this is the current state)
              next[key] = el.value;
            });

            setStudentAnswers((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
              return next;
            });
          } catch {}
        };
        const intervalId = window.setInterval(poll, 800);

        // Cleanup for this setupListeners run
        (iframe as any).__htmlCssCleanup = () => {
          try {
            iframeDoc.removeEventListener("input", handler, true);
            iframeDoc.removeEventListener("change", handler, true);
            window.clearInterval(intervalId);
          } catch {}
        };
        return allInputs.length;
      } catch (e) {
        console.error('Error setting up iframe listeners:', e);
        return 0;
      }
    };

    const trySetupWithRetry = (attempt = 0) => {
      const boundCount = setupListeners();
      if (boundCount > 0) {
        return;
      }
      if (attempt >= 20) {
        console.error('❌ Failed to find inputs after 20 attempts (~2 seconds)');
        console.error('Iframe content:', iframe.contentDocument?.body?.innerHTML?.substring(0, 500));
        return;
      }
      window.setTimeout(() => trySetupWithRetry(attempt + 1), 100);
    };

    const onLoad = () => {
      // Give the browser a moment to parse srcDoc
      window.setTimeout(() => trySetupWithRetry(0), 0);
    };

    // Always listen for load; srcDoc updates should trigger it.
    iframe.addEventListener("load", onLoad);
    // Best-effort: attempt once immediately as well (in case load already happened).
    onLoad();

    return () => {
      try {
        (iframe as any).__htmlCssCleanup?.();
      } catch {}
      iframe.removeEventListener("load", onLoad);
    };
  }, [question.prompt?.htmlCode, question.prompt?.cssCode, readOnly, studentAnswers]);

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
      {/* Question Instructions */}
      {question.prompt?.text && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">
            {question.prompt.text}
          </p>
        </div>
      )}

      {/* Interactive HTML Render */}
      {renderInteractiveHTML()}
    </div>
  );
}
