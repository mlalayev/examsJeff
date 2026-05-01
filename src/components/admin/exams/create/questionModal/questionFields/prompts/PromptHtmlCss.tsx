"use client";

import { Question } from "../../../types";
import { Info, Code, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { extractHtmlCssAnswerKeyV1 } from "@/lib/htmlCssAnswerKey";

interface PromptHtmlCssProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function PromptHtmlCss({ question, onChange }: PromptHtmlCssProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const htmlCode = question.prompt?.htmlCode || "";
  const cssCode = question.prompt?.cssCode || "";
  const questionText = question.prompt?.text || "";

  // Update preview when code changes
  useEffect(() => {
    setPreviewError(null);
  }, [htmlCode, cssCode]);

  // Keep answerKey in sync with HTML correct-answer attributes
  useEffect(() => {
    const extracted = extractHtmlCssAnswerKeyV1(htmlCode || "");
    const nextAnswerKey = extracted;
    const prev = question.answerKey;
    if (JSON.stringify(prev) !== JSON.stringify(nextAnswerKey)) {
      onChange({
        ...question,
        answerKey: nextAnswerKey,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlCode]);

  const handleQuestionTextChange = (text: string) => {
    onChange({
      ...question,
      prompt: {
        ...question.prompt,
        text,
      },
    });
  };

  const handleHtmlChange = (html: string) => {
    onChange({
      ...question,
      prompt: {
        ...question.prompt,
        htmlCode: html,
      },
    });
  };

  const handleCssChange = (css: string) => {
    onChange({
      ...question,
      prompt: {
        ...question.prompt,
        cssCode: css,
      },
    });
  };

  const renderPreview = () => {
    try {
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
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
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Live Preview (How it will appear in exam)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              {showPreview ? "Hide" : "Show"}
            </button>
          </div>
          {showPreview && (
            <div className="p-4 bg-white min-h-[200px]">
              <iframe
                srcDoc={fullHtml}
                title="HTML Preview"
                className="w-full h-[300px] border-0"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>
      );
    } catch (err: any) {
      return (
        <div className="border border-red-300 rounded-lg p-4 bg-red-50">
          <p className="text-sm text-red-700">Preview Error: {err.message}</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800">
          <p className="font-medium mb-1">HTML/CSS Interactive Question Instructions:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li><strong>Text inputs:</strong> Use <code className="bg-blue-100 px-1 rounded">data-answer="ans1 | ans2 | ans3"</code> to define multiple correct answers</li>
            <li><strong>Radio buttons:</strong> Add <code className="bg-blue-100 px-1 rounded">data-correct="true"</code> to mark correct option(s)</li>
            <li>Example text: <code className="bg-blue-100 px-1 rounded">{`<input data-answer="60% | 0.6 | sixty percent" />`}</code></li>
            <li>Example radio: <code className="bg-blue-100 px-1 rounded">{`<input type="radio" value="a" data-correct="true" />`}</code></li>
            <li>Students will interact with these elements during the exam</li>
            <li>System automatically grades based on data-answer and data-correct attributes</li>
          </ul>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Question Instructions * (Tell students what to do)
        </label>
        <textarea
          value={questionText}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="Example: Fill in the form below. For the age field, enter a number. For the question 'What is 60% as a decimal?', you can write 0.6 or 0.60 or 60%. Select the correct answer(s) for the multiple choice questions."
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-h-[80px] resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">
          ✅ Be specific: Tell students what format answers should be in, what to select, etc.
        </p>
      </div>

      {/* HTML Code Editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-gray-700">
            <Code className="w-3 h-3 inline mr-1" />
            HTML Code *
          </label>
          <span className="text-xs text-gray-500">{htmlCode.split('\n').length} lines</span>
        </div>
        <textarea
          value={htmlCode}
          onChange={(e) => handleHtmlChange(e.target.value)}
          placeholder={`Enter your HTML with interactive elements...\n\nText input with multiple answers:\n<input type="text" data-answer="60% | 0.6 | sixty percent" />\n\nRadio buttons (mark correct with data-correct):\n<input type="radio" name="q1" value="A" data-correct="true" /> Option A\n<input type="radio" name="q1" value="B" /> Option B\n\nCheckbox:\n<input type="checkbox" data-answer="true" /> Check if correct`}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-400 min-h-[200px] resize-y bg-gray-50"
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">
          <strong>Text:</strong> <code className="bg-gray-200 px-1 rounded">data-answer="ans1 | ans2 | ans3"</code> • <strong>Radio:</strong> <code className="bg-gray-200 px-1 rounded">data-correct="true"</code>
        </p>
      </div>

      {/* CSS Code Editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-gray-700">
            <Code className="w-3 h-3 inline mr-1" />
            CSS Code
          </label>
          <span className="text-xs text-gray-500">{cssCode.split('\n').length} lines</span>
        </div>
        <textarea
          value={cssCode}
          onChange={(e) => handleCssChange(e.target.value)}
          placeholder="Enter your CSS code here... (optional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-400 min-h-[150px] resize-y bg-gray-50"
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">
          CSS styling (optional, leave empty if not needed)
        </p>
      </div>

      {/* Live Preview */}
      {renderPreview()}
    </div>
  );
}
