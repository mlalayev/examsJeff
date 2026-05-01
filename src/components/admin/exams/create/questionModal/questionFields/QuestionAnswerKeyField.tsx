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
        // Parse HTML to extract correct answers from attributes
        const htmlCode = question.prompt?.htmlCode || "";
        const parser = new DOMParser();
        let answerSummary: Array<{id: string, type: string, correctAnswers: string[]}> = [];
        
        try {
          const doc = parser.parseFromString(htmlCode, 'text/html');
          
          // Find text inputs with data-answer attribute
          const textInputs = doc.querySelectorAll('input[type="text"][data-answer], input:not([type])[data-answer], textarea[data-answer]');
          textInputs.forEach((el) => {
            const answers = el.getAttribute('data-answer');
            if (answers) {
              const answerList = answers.split('|').map(a => a.trim()).filter(a => a);
              answerSummary.push({
                id: `Input: ${el.getAttribute('placeholder') || 'text field'}`,
                type: 'text',
                correctAnswers: answerList
              });
            }
          });
          
          // Find radio buttons with data-correct="true"
          const correctRadios = doc.querySelectorAll('input[type="radio"][data-correct="true"]');
          const radioGroups: Record<string, string[]> = {};
          correctRadios.forEach((el) => {
            const name = el.getAttribute('name') || 'unnamed';
            const value = el.getAttribute('value') || '';
            const label = el.nextSibling?.textContent?.trim() || value;
            if (!radioGroups[name]) {
              radioGroups[name] = [];
            }
            radioGroups[name].push(label);
          });
          
          Object.entries(radioGroups).forEach(([name, values]) => {
            answerSummary.push({
              id: `Radio group: ${name}`,
              type: 'radio',
              correctAnswers: values
            });
          });
          
          // Find checkboxes with data-answer="true"
          const correctCheckboxes = doc.querySelectorAll('input[type="checkbox"][data-answer="true"]');
          correctCheckboxes.forEach((el) => {
            const label = el.nextSibling?.textContent?.trim() || el.getAttribute('value') || 'checkbox';
            answerSummary.push({
              id: `Checkbox: ${label}`,
              type: 'checkbox',
              correctAnswers: ['checked']
            });
          });
          
        } catch (e) {
          console.error('Error parsing HTML:', e);
        }

        return (
          <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-xs text-green-800">
                <p className="font-medium mb-1">✅ Correct Answers Auto-Detected from HTML</p>
                <p>Answers are defined directly in your HTML using <code className="bg-green-100 px-1 rounded">data-answer</code> and <code className="bg-green-100 px-1 rounded">data-correct</code> attributes.</p>
              </div>
            </div>

            {answerSummary.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-700">
                  <strong>No correct answers found in HTML.</strong><br/>
                  • For text inputs: Add <code className="bg-amber-100 px-1 rounded">data-answer="ans1 | ans2"</code><br/>
                  • For radio buttons: Add <code className="bg-amber-100 px-1 rounded">data-correct="true"</code> to correct option(s)<br/>
                  • For checkboxes: Add <code className="bg-amber-100 px-1 rounded">data-answer="true"</code> if should be checked
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">
                  Found {answerSummary.length} question(s) with correct answers:
                </p>
                
                {answerSummary.map((item, idx) => (
                  <div key={idx} className="border border-green-200 rounded-md p-3 bg-green-50">
                    <p className="text-xs font-medium text-gray-900 mb-2">
                      {item.id}
                    </p>
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-green-700 font-medium">Correct Answer(s):</span>
                      <div className="flex-1">
                        {item.correctAnswers.map((answer, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 bg-white border border-green-300 rounded text-xs font-medium text-green-800 mr-1 mb-1">
                            {answer}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-700">
                <strong>💡 How it works:</strong><br/>
                • <strong>Text inputs:</strong> Use <code className="bg-blue-100 px-1 rounded">data-answer="answer1 | answer2 | answer3"</code> (separate with |)<br/>
                • <strong>Radio buttons:</strong> Add <code className="bg-blue-100 px-1 rounded">data-correct="true"</code> to correct option(s)<br/>
                • <strong>Checkboxes:</strong> Add <code className="bg-blue-100 px-1 rounded">data-answer="true"</code> if should be checked<br/>
                • Student answers are automatically compared with these values
              </p>
            </div>
          </div>
        );

      case "SHORT_TEXT":
        const htmlCode = question.prompt?.htmlCode || "";
        const parser = new DOMParser();
        let interactiveElements: Array<{id: string, type: string, label: string, value?: string, name?: string}> = [];
        
        try {
          const doc = parser.parseFromString(htmlCode, 'text/html');
          const elementsWithAnswer = doc.querySelectorAll('[data-answer]');
          
          elementsWithAnswer.forEach((el) => {
            const id = el.getAttribute('data-answer');
            const type = el.getAttribute('type') || el.tagName.toLowerCase();
            const value = el.getAttribute('value') || '';
            const name = el.getAttribute('name') || '';
            const label = el.getAttribute('placeholder') || el.textContent?.trim() || `Element ${id}`;
            
            if (id) {
              interactiveElements.push({ id, type, label: label.substring(0, 50), value, name });
            }
          });
        } catch (e) {
          console.error('Error parsing HTML:', e);
        }

        // Group radio buttons by data-answer id
        const radioGroups: Record<string, Array<{value: string, label: string}>> = {};
        interactiveElements.forEach(el => {
          if (el.type === 'radio') {
            if (!radioGroups[el.id]) {
              radioGroups[el.id] = [];
            }
            radioGroups[el.id].push({ value: el.value, label: el.label });
          }
        });

        // Get unique elements (for radios, just keep one entry per group)
        const uniqueElements = interactiveElements.filter((el, index, self) => 
          el.type !== 'radio' || index === self.findIndex(e => e.id === el.id)
        );

        return (
          <div className="space-y-3 p-3 bg-white border border-gray-200 rounded-md">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Set Correct Answers</p>
                <p>• For text inputs: Add multiple acceptable answers (one per line)</p>
                <p>• For radio buttons: Check the correct option(s)</p>
              </div>
            </div>

            {uniqueElements.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-xs text-amber-700">
                  <strong>No interactive elements found.</strong> Add <code className="bg-amber-100 px-1 rounded">data-answer="id"</code> to your HTML inputs, radios, checkboxes, or selects.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-700">
                  Found {uniqueElements.length} interactive element(s):
                </p>
                
                {uniqueElements.map((element) => {
                  const currentAnswers = question.answerKey?.interactiveAnswers || {};
                  
                  // For text inputs: array of possible answers
                  if (element.type === 'text' || element.type === 'number' || element.type === 'email') {
                    const currentValue = Array.isArray(currentAnswers[element.id]) 
                      ? currentAnswers[element.id].join('\n') 
                      : (currentAnswers[element.id] || "");
                    
                    return (
                      <div key={element.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-900">
                            ID: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">{element.id}</code>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Type: <span className="font-medium">{element.type}</span> • Label: {element.label}
                          </p>
                        </div>
                        
                        <label className="block text-xs font-medium text-gray-700 mb-1 mt-2">
                          Correct Answers (one per line):
                        </label>
                        <textarea
                          value={currentValue}
                          onChange={(e) => {
                            const answers = e.target.value.split('\n').filter(a => a.trim());
                            onChange({
                              ...question,
                              answerKey: {
                                ...question.answerKey,
                                interactiveAnswers: {
                                  ...(question.answerKey?.interactiveAnswers || {}),
                                  [element.id]: answers,
                                },
                              },
                            });
                          }}
                          placeholder={`60 percent\n60%\nsixty percent`}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-mono focus:outline-none focus:border-gray-400 bg-white resize-y"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ✅ Add multiple acceptable answers (e.g., "60%", "60 percent", "sixty percent")
                        </p>
                      </div>
                    );
                  }
                  
                  // For radio buttons: show all options with checkboxes
                  if (element.type === 'radio' && radioGroups[element.id]) {
                    const correctValues = Array.isArray(currentAnswers[element.id]) 
                      ? currentAnswers[element.id] 
                      : (currentAnswers[element.id] ? [currentAnswers[element.id]] : []);
                    
                    return (
                      <div key={element.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-900">
                            ID: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">{element.id}</code>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Type: <span className="font-medium">radio group</span> • {radioGroups[element.id].length} options
                          </p>
                        </div>
                        
                        <label className="block text-xs font-medium text-gray-700 mb-2 mt-2">
                          Select Correct Answer(s):
                        </label>
                        <div className="space-y-2">
                          {radioGroups[element.id].map((option, idx) => (
                            <label key={idx} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={correctValues.includes(option.value)}
                                onChange={(e) => {
                                  let newValues = [...correctValues];
                                  if (e.target.checked) {
                                    if (!newValues.includes(option.value)) {
                                      newValues.push(option.value);
                                    }
                                  } else {
                                    newValues = newValues.filter(v => v !== option.value);
                                  }
                                  
                                  onChange({
                                    ...question,
                                    answerKey: {
                                      ...question.answerKey,
                                      interactiveAnswers: {
                                        ...(question.answerKey?.interactiveAnswers || {}),
                                        [element.id]: newValues,
                                      },
                                    },
                                  });
                                }}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <span className="text-xs font-medium text-gray-800">{option.label}</span>
                                <span className="text-xs text-gray-500 ml-2">(value: <code className="bg-gray-100 px-1 rounded">{option.value}</code>)</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ✅ You can select multiple correct answers if needed
                        </p>
                      </div>
                    );
                  }
                  
                  // For checkboxes
                  if (element.type === 'checkbox') {
                    const currentValue = currentAnswers[element.id] || false;
                    
                    return (
                      <div key={element.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-900">
                            ID: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">{element.id}</code>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Type: <span className="font-medium">{element.type}</span> • Label: {element.label}
                          </p>
                        </div>
                        
                        <label className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentValue === true || currentValue === 'true'}
                            onChange={(e) => {
                              onChange({
                                ...question,
                                answerKey: {
                                  ...question.answerKey,
                                  interactiveAnswers: {
                                    ...(question.answerKey?.interactiveAnswers || {}),
                                    [element.id]: e.target.checked,
                                  },
                                },
                              });
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs font-medium text-gray-800">Should be checked</span>
                        </label>
                      </div>
                    );
                  }
                  
                  // For select dropdowns
                  if (element.type === 'select') {
                    const currentValue = currentAnswers[element.id] || "";
                    
                    return (
                      <div key={element.id} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-900">
                            ID: <code className="bg-white px-2 py-0.5 rounded border border-gray-300">{element.id}</code>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Type: <span className="font-medium">{element.type}</span> • Label: {element.label}
                          </p>
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
                          placeholder="Enter the value of correct option"
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-gray-400 bg-white"
                        />
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            )}

            <div className="bg-gray-100 border border-gray-300 rounded-md p-2 mt-3">
              <p className="text-xs text-gray-700">
                <strong>💡 Tip:</strong> For text inputs, student's answer will match if it equals ANY of your acceptable answers.
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
