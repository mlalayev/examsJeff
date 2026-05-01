"use client";

import { Question } from "../../../types";
import { Info, Code, Eye } from "lucide-react";
import { useState, useEffect } from "react";

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
          <p className="font-medium mb-1">HTML/CSS Question Type Instructions:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Write your HTML and CSS code below</li>
            <li>The live preview shows how the code will render in the exam</li>
            <li>Students will see this exact output during the exam</li>
            <li>You can add multiple correct answers in the "Correct Answer" section below</li>
            <li>This question type is for evaluating HTML/CSS knowledge</li>
          </ul>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Question Instructions *
        </label>
        <textarea
          value={questionText}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="E.g., Create a button that is red with white text and rounded corners"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 min-h-[60px] resize-y"
        />
        <p className="text-xs text-gray-500 mt-1">
          This instruction will be shown to students
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
          placeholder="Enter your HTML code here..."
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm font-mono focus:outline-none focus:border-gray-400 min-h-[200px] resize-y bg-gray-50"
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">
          Write the HTML code that students will see in the exam
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
