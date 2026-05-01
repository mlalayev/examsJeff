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
  const [interactiveAnswers, setInteractiveAnswers] = useState<Record<string, any>>(value || {});

  // Update parent when interactive answers change
  useEffect(() => {
    if (JSON.stringify(interactiveAnswers) !== JSON.stringify(value)) {
      onChange(interactiveAnswers);
    }
  }, [interactiveAnswers]);

  // Inject event listeners into iframe
  useEffect(() => {
    if (!iframeRef.current || readOnly) return;

    const iframe = iframeRef.current;
    
    const setupListeners = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Find all elements with data-answer attribute
        const interactiveElements = iframeDoc.querySelectorAll('[data-answer]');
        
        interactiveElements.forEach((element: any) => {
          const answerId = element.getAttribute('data-answer');
          if (!answerId) return;

          // Restore previous value if exists
          if (interactiveAnswers[answerId] !== undefined) {
            if (element.type === 'checkbox') {
              element.checked = interactiveAnswers[answerId] === true || interactiveAnswers[answerId] === 'true';
            } else if (element.type === 'radio') {
              element.checked = interactiveAnswers[answerId] === element.value;
            } else {
              element.value = interactiveAnswers[answerId];
            }
          }

          // Add event listeners
          const handleChange = () => {
            let answerValue: any;
            
            if (element.type === 'checkbox') {
              answerValue = element.checked;
            } else if (element.type === 'radio') {
              // For radio, collect all checked radios with this data-answer id
              const allRadios = iframeDoc.querySelectorAll(`[data-answer="${answerId}"]`);
              const checkedRadios: string[] = [];
              allRadios.forEach((radio: any) => {
                if (radio.checked) {
                  checkedRadios.push(radio.value);
                }
              });
              answerValue = checkedRadios.length === 1 ? checkedRadios[0] : checkedRadios;
            } else if (element.tagName === 'SELECT') {
              answerValue = element.value;
            } else {
              answerValue = element.value;
            }

            setInteractiveAnswers(prev => ({
              ...prev,
              [answerId]: answerValue
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
            className="w-full h-[400px] border-0"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
        {!readOnly && (
          <div className="bg-blue-50 border-t border-blue-200 px-3 py-2">
            <p className="text-xs text-blue-700">
              💡 Interact with the elements above. Your answers are automatically saved.
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
          <p className="text-sm text-blue-900 font-medium">
            {question.prompt.text}
          </p>
        </div>
      )}

      {/* Interactive HTML Render */}
      {renderInteractiveHTML()}

      {/* Show current answers (for debugging/clarity) */}
      {!readOnly && Object.keys(interactiveAnswers).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Your Current Answers:</p>
          <div className="space-y-1">
            {Object.entries(interactiveAnswers).map(([key, val]) => (
              <div key={key} className="text-xs text-gray-600">
                <code className="bg-white px-2 py-0.5 rounded border border-gray-300 mr-2">{key}</code>
                <span className="font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
