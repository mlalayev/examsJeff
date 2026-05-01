"use client";

import React, { useState, useEffect } from "react";
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
  const [showPreview, setShowPreview] = useState(true);
  
  const studentHtml = value?.html || "";
  const studentCss = value?.css || "";

  const handleHtmlChange = (html: string) => {
    onChange({
      ...value,
      html,
    });
  };

  const handleCssChange = (css: string) => {
    onChange({
      ...value,
      css,
    });
  };

  const renderPreview = () => {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${studentCss}
        </style>
      </head>
      <body>
        ${studentHtml}
      </body>
      </html>
    `;

    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Live Preview</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-3 h-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Show
              </>
            )}
          </button>
        </div>
        {showPreview && (
          <div className="p-4 bg-white">
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
  };

  // Display the reference HTML/CSS from question
  const referenceHtml = question.prompt?.htmlCode || "";
  const referenceCss = question.prompt?.cssCode || "";

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

      {/* Reference Code Display */}
      {(referenceHtml || referenceCss) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Reference Code (For Your Reference)
          </p>
          
          {referenceHtml && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Code className="w-3 h-3" />
                HTML Code
              </p>
              <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono overflow-x-auto max-h-[150px] overflow-y-auto">
                <code>{referenceHtml}</code>
              </pre>
            </div>
          )}
          
          {referenceCss && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Code className="w-3 h-3" />
                CSS Code
              </p>
              <pre className="bg-white border border-gray-200 rounded p-2 text-xs font-mono overflow-x-auto max-h-[150px] overflow-y-auto">
                <code>{referenceCss}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Student HTML Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Code className="w-4 h-4" />
          Your HTML Code
        </label>
        <textarea
          value={studentHtml}
          onChange={(e) => handleHtmlChange(e.target.value)}
          disabled={readOnly}
          placeholder="Write your HTML code here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[200px] resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">
          {studentHtml.split('\n').length} lines
        </p>
      </div>

      {/* Student CSS Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Code className="w-4 h-4" />
          Your CSS Code (Optional)
        </label>
        <textarea
          value={studentCss}
          onChange={(e) => handleCssChange(e.target.value)}
          disabled={readOnly}
          placeholder="Write your CSS code here... (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent min-h-[150px] resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-1">
          {studentCss.split('\n').length} lines
        </p>
      </div>

      {/* Live Preview */}
      {!readOnly && (studentHtml || studentCss) && renderPreview()}
    </div>
  );
}
