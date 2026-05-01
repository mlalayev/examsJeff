"use client";

import { Question } from "../../types";

interface QuestionAnswerKeyFieldProps {
  question: Question;
  onChange: (question: Question) => void;
}

export function QuestionAnswerKeyField({
  question,
  onChange,
}: QuestionAnswerKeyFieldProps) {
  const renderAnswerKey = () => {
    switch (question.qtype) {
      case "TF":
        return (
          <select
            value={question.answerKey?.value ? "true" : "false"}
            onChange={(e) => {
              onChange({
                ...question,
                answerKey: { value: e.target.value === "true" },
              });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case "MCQ_SINGLE":
      case "INLINE_SELECT":
        return (
          <select
            value={question.answerKey?.index ?? 0}
            onChange={(e) => {
              onChange({
                ...question,
                answerKey: { index: parseInt(e.target.value) },
              });
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            {(question.options?.choices || []).map((opt: string, idx: number) => (
              <option key={idx} value={idx}>
                {opt || `Option ${idx + 1}`}
              </option>
            ))}
          </select>
        );

      case "MCQ_MULTI":
        return (
          <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            {(question.options?.choices || []).map((opt: string, idx: number) => (
              <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={(question.answerKey?.indices || []).includes(idx)}
                  onChange={(e) => {
                    const indices = [...(question.answerKey?.indices || [])];
                    if (e.target.checked) {
                      indices.push(idx);
                    } else {
                      const pos = indices.indexOf(idx);
                      if (pos > -1) indices.splice(pos, 1);
                    }
                    onChange({
                      ...question,
                      answerKey: { indices: indices.sort() },
                    });
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt || `Option ${idx + 1}`}</span>
              </label>
            ))}
          </div>
        );

      case "DND_GAP":
        return (
          <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            <p className="text-xs text-gray-500 mb-2">
              Word Bank will be automatically generated from the correct answers above.
            </p>
            {Array.isArray(question.options?.bank) && question.options.bank.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Auto-generated Word Bank:</p>
                <div className="flex flex-wrap gap-2">
                  {question.options.bank.map((word: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "ORDER_SENTENCE":
        return (
          <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            <p className="text-xs sm:text-sm text-gray-500">
              The correct order is determined by the token order. Students will see them shuffled.
            </p>
            {Array.isArray(question.prompt?.tokens) && question.prompt.tokens.length > 0 && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">Current order (correct answer):</p>
                <div className="flex flex-wrap gap-2">
                  {question.prompt.tokens.map((token: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {idx + 1}. {token}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Answer key: {JSON.stringify(question.prompt.tokens.map((_: any, idx: number) => idx))}
                </p>
              </div>
            )}
          </div>
        );

      case "IMAGE_INTERACTIVE":
        const elements = question.options?.elements || question.options?.hotspots || [];
        const correctIds = question.answerKey?.correctElementIds || question.answerKey?.correctHotspotIds || [];
        
        if (elements.length === 0) {
          return (
            <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                Please add interactive elements to the image.
              </p>
            </div>
          );
        }

        const inputElements = elements.filter((e: any) => e.type === "input");
        const clickableElements = elements.filter((e: any) => !e.type || e.type === "hotspot" || e.type === "radio" || e.type === "checkbox");
        
        return (
          <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            {clickableElements.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Correct Clickable Elements:</p>
                {correctIds.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    Please mark at least one clickable element as correct.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {elements
                      .filter((e: any) => correctIds.includes(e.id))
                      .map((element: any) => (
                        <span key={element.id} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                          {element.type === "input" ? "📝" : element.type === "radio" ? "🔘" : element.type === "checkbox" ? "☑️" : "🎯"} {element.label}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
            
            {inputElements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Text Input Answers:</p>
                <div className="space-y-1">
                  {inputElements.map((element: any) => (
                    <div key={element.id} className="text-xs">
                      <span className="font-medium text-gray-600">{element.label}:</span>{" "}
                      {element.correctAnswer ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                          {element.correctAnswer}
                        </span>
                      ) : (
                        <span className="text-amber-600">No answer set</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Interaction Type: {question.prompt?.interactionType === "single" ? "Single Selection" : "Multiple Selection"}
            </p>
          </div>
        );

      case "HTML_CSS":
        // Parse HTML to find interactive elements with data-answer attribute
        const htmlCode = question.prompt?.htmlCode || "";
        const parser = new DOMParser();
        let interactiveElements: Array<{id: string, type: string, label: string}> = [];
        
        try {
          const doc = parser.parseFromString(htmlCode, 'text/html');
          const elementsWithAnswer = doc.querySelectorAll('[data-answer]');
          
          elementsWithAnswer.forEach((el) => {
            const id = el.getAttribute('data-answer');
            const type = el.getAttribute('type') || el.tagName.toLowerCase();
            const label = el.getAttribute('placeholder') || el.textContent?.trim() || `Element ${id}`;
            
            if (id && !interactiveElements.find(e => e.id === id)) {
              interactiveElements.push({ id, type, label: label.substring(0, 50) });
            }
          });
        } catch (e) {
          console.error('Error parsing HTML:', e);
        }

        return (
          <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Set Correct Answers for Interactive Elements</p>
                <p>For each element with <code className="bg-blue-100 px-1 rounded">data-answer</code> attribute, specify the correct answer below.</p>
              </div>
            </div>

            {interactiveElements.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-700">
                  <strong>No interactive elements found.</strong> Add <code className="bg-amber-100 px-1 rounded">data-answer="id"</code> to your HTML inputs, radios, checkboxes, or selects.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">
                  Found {interactiveElements.length} interactive element(s):
                </p>
                
                {interactiveElements.map((element) => {
                  const currentAnswers = question.answerKey?.interactiveAnswers || {};
                  const currentValue = currentAnswers[element.id] || "";
                  
                  return (
                    <div key={element.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            ID: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">{element.id}</code>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Type: <span className="font-medium">{element.type}</span> • Label: {element.label}
                          </p>
                        </div>
                      </div>
                      
                      <label className="block text-xs font-medium text-gray-700 mb-1 mt-2">
                        Correct Answer:
                      </label>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => {
                          onChange({
                            ...question,
                            answerKey: {
                              ...question.answerKey,
                              interactiveAnswers: {
                                ...(question.answerKey?.interactiveAnswers || {}),
                                [element.id]: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder={`Enter correct answer for ${element.id}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {element.type === 'radio' && '• For radio: enter the value attribute of correct option'}
                        {element.type === 'checkbox' && '• For checkbox: enter "true" if should be checked'}
                        {element.type === 'select' && '• For select: enter the value of correct option'}
                        {(element.type === 'text' || element.type === 'input') && '• For text input: enter the exact answer (case-sensitive)'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-gray-100 border border-gray-300 rounded-md p-2 mt-3">
              <p className="text-xs text-gray-700">
                <strong>💡 Tip:</strong> Students' answers will be automatically compared with these correct answers during grading.
              </p>
            </div>
          </div>
        );

      case "SHORT_TEXT":
      case "FILL_IN_BLANK":
      case "ESSAY":
      case "SPEAKING_RECORDING":
        // These are handled in the prompt section
        return null;

      default:
        return (
          <p className="text-xs text-gray-500">
            Answer key is configured in the prompt section above.
          </p>
        );
    }
  };

  const answerKeyContent = renderAnswerKey();

  if (!answerKeyContent) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 border-l-2 border-r-2 border-b-2 border-gray-300 rounded-b-md">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Correct Answer *
      </label>
      {answerKeyContent}
    </div>
  );
}
