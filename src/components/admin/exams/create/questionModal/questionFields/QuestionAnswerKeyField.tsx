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
        return (
          <div className="space-y-2 p-3 bg-white border border-gray-200 rounded-md">
            {(question.answerKey?.correctHotspotIds || []).length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                Please mark at least one area as the correct answer in the configuration above.
              </p>
            ) : (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Correct Answer(s):</p>
                <div className="flex flex-wrap gap-2">
                  {(question.options?.hotspots || [])
                    .filter((h: any) => (question.answerKey?.correctHotspotIds || []).includes(h.id))
                    .map((hotspot: any) => (
                      <span key={hotspot.id} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                        {hotspot.label}
                      </span>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Interaction Type: {question.prompt?.interactionType === "single" ? "Single Selection" : "Multiple Selection"}
                </p>
              </div>
            )}
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
