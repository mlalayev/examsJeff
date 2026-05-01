"use client";

import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Eye } from "lucide-react";
import { processHtmlCssQuestion } from "@/lib/htmlCssQuestion";

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

function applyAnswersToDom(doc: Document, val: Record<string, any>) {
  if (!val || typeof val !== "object") return;

  doc.querySelectorAll("[data-html-css-key]").forEach((el) => {
    const key = el.getAttribute("data-html-css-key");
    if (!key || val[key] === undefined) return;
    const inp = el as HTMLInputElement;
    if (inp.type === "checkbox") {
      inp.checked = val[key] === true || val[key] === "true";
    } else {
      inp.value = String(val[key]);
    }
  });

  doc.querySelectorAll('input[type="radio"]').forEach((el) => {
    const inp = el as HTMLInputElement;
    const key = `htmlcss_radio_${inp.name}`;
    if (!inp.name || val[key] === undefined) return;
    inp.checked = inp.value === String(val[key]);
  });
}

export default function QHtmlCss({ question, value, readOnly, onChange }: QHtmlCssProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSentJson = useRef<string>("");
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const htmlCode = question.prompt?.htmlCode || "";

  const { augmentedBodyHtml } = useMemo(
    () => processHtmlCssQuestion(htmlCode),
    [htmlCode]
  );

  const fullHtml = useMemo(() => {
    const cssCode = question.prompt?.cssCode || "";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif;padding:20px;}
      ${cssCode}
    </style></head><body>${augmentedBodyHtml}</body></html>`;
  }, [augmentedBodyHtml, question.prompt?.cssCode]);

  const readAnswersFromDom = useCallback(
    (doc: Document) => {
      const snap: Record<string, any> = {};

      doc.querySelectorAll("[data-html-css-key]").forEach((el) => {
        const key = el.getAttribute("data-html-css-key");
        if (!key) return;
        const inp = el as HTMLInputElement;
        if (inp.type === "checkbox") snap[key] = inp.checked;
        else snap[key] = inp.value;
      });

      const radioNames = new Set<string>();
      doc.querySelectorAll('input[type="radio"]').forEach((el) => {
        const n = (el as HTMLInputElement).name;
        if (n) radioNames.add(n);
      });
      radioNames.forEach((name) => {
        const key = `htmlcss_radio_${name}`;
        let picked = "";
        doc.querySelectorAll('input[type="radio"]').forEach((el) => {
          const inp = el as HTMLInputElement;
          if (inp.name === name && inp.checked) picked = inp.value;
        });
        snap[key] = picked;
      });

      const json = JSON.stringify(snap);
      if (json !== lastSentJson.current) {
        lastSentJson.current = json;
        onChange(snap);
      }
    },
    [onChange]
  );

  useEffect(() => {
    if (readOnly) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const initial =
        valueRef.current && typeof valueRef.current === "object" && !Array.isArray(valueRef.current)
          ? valueRef.current
          : {};
      applyAnswersToDom(doc, initial);
      lastSentJson.current = "";
      readAnswersFromDom(doc);

      const handler = () => readAnswersFromDom(doc);
      doc.addEventListener("input", handler);
      doc.addEventListener("change", handler);

      return () => {
        doc.removeEventListener("input", handler);
        doc.removeEventListener("change", handler);
      };
    };

    let cleanup: (() => void) | undefined;
    const wrapped = () => {
      cleanup?.();
      cleanup = onLoad();
    };

    iframe.addEventListener("load", wrapped);
    if (iframe.contentDocument?.readyState === "complete") {
      wrapped();
    }

    return () => {
      iframe.removeEventListener("load", wrapped);
      cleanup?.();
    };
  }, [fullHtml, readOnly, readAnswersFromDom]);

  useEffect(() => {
    if (readOnly) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body?.innerHTML) return;
    const v = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    applyAnswersToDom(doc, v);
  }, [value, readOnly]);

  return (
    <div className="space-y-4">
      {question.prompt?.text && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">{question.prompt.text}</p>
        </div>
      )}

      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">Interactive Question</span>
        </div>
        <div className="p-4 bg-white">
          <iframe
            ref={iframeRef}
            key={fullHtml.slice(0, 200)}
            srcDoc={fullHtml}
            title="HTML/CSS question"
            className="w-full min-h-[400px] border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
        {!readOnly && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700">Answers save automatically when you change inputs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
