"use client";

import React, { useState, useEffect, useRef } from "react";
import { Code, Eye, EyeOff } from "lucide-react";

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
  }, [studentAnswers]);

  // Inject event listeners into iframe
  useEffect(() => {
    if (!iframeRef.current || readOnly) return;

    const iframe = iframeRef.current;
    
    const setupListeners = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // We only persist answers for fields that have name/id
        const allInputs = iframeDoc.querySelectorAll("input, textarea, select");
        
        allInputs.forEach((element: any) => {
          const fieldId = element.name || element.id;
          if (!fieldId) return;

          // Restore previous value if exists
          if (studentAnswers[fieldId] !== undefined) {
            if (element.type === 'checkbox') {
              element.checked = studentAnswers[fieldId] === true || studentAnswers[fieldId] === 'true';
            } else if (element.type === 'radio') {
              element.checked = studentAnswers[fieldId] === element.value;
            } else {
              element.value = studentAnswers[fieldId];
            }
          }

          // Add event listeners
          const handleChange = () => {
            let answerValue: any;
            
            if (element.type === 'checkbox') {
              answerValue = element.checked;
            } else if (element.type === 'radio') {
              // Store selected value for the radio group (by name)
              if (!element.checked) return;
              answerValue = element.value;
            } else if (element.tagName === 'SELECT') {
              answerValue = element.value;
            } else {
              answerValue = element.value;
            }

            setStudentAnswers(prev => ({
              ...prev,
              [fieldId]: answerValue
            }));
          };

          element.addEventListener('change', handleChange);
          element.addEventListener('input', handleChange);
        });
      } catch (e) {
        console.error('Error setting up iframe listeners:', e);
      }
    };

    // Wait for iframe to load
    if (iframe.contentDocument?.readyState === 'complete') {
      setupListeners();
    } else {
      iframe.addEventListener('load', setupListeners);
    }

    return () => {
      iframe.removeEventListener('load', setupListeners);
    };
  }, [question.prompt?.htmlCode, question.prompt?.cssCode, readOnly]);

  const renderInteractiveHTML = () => {
    const htmlCode = question.prompt?.htmlCode || "";
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
        <div className="p-4 bg-white">
          <iframe
            ref={iframeRef}
            srcDoc={fullHtml}
            title="Interactive HTML Question"
            className="w-full min-h-[400px] border-0"
            sandbox="allow-same-origin"
            style={{ height: 'auto' }}
          />
        </div>
        {!readOnly && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700">
              💡 Fill in the form above. Your answers are automatically saved.
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
