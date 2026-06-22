"use client";

import { BaseQuestionProps } from "./types";
import { QuestionImage } from "./QuestionImage";
import {
  countInlineSelectBlanks,
  getInlineSelectBlankChoices,
  isMultiInlineSelectAnswer,
} from "@/lib/inline-select-utils";

type InlineSelectValue = number | null | Record<string, number>;

export function QInlineSelect({
  question,
  value,
  onChange,
  readOnly,
}: BaseQuestionProps<InlineSelectValue>) {
  const promptText = question.prompt?.text || "";
  const imageUrl = question.prompt?.imageUrl;
  const blankCount = countInlineSelectBlanks(promptText);
  const blankChoices = getInlineSelectBlankChoices(question.options, blankCount);
  const isMulti = blankCount > 1;

  const getBlankValue = (blankIdx: number): number | null => {
    if (isMulti) {
      if (!isMultiInlineSelectAnswer(value)) return null;
      const v = value[String(blankIdx)];
      return typeof v === "number" ? v : null;
    }
    return typeof value === "number" ? value : null;
  };

  const setBlankValue = (blankIdx: number, idx: number | null) => {
    if (readOnly) return;
    if (isMulti) {
      const current = isMultiInlineSelectAnswer(value) ? { ...value } : {};
      if (idx === null) {
        delete current[String(blankIdx)];
      } else {
        current[String(blankIdx)] = idx;
      }
      onChange(current);
      return;
    }
    onChange(idx);
  };

  const DropdownSelect = ({ blankIdx }: { blankIdx: number }) => {
    const choices = blankChoices[blankIdx] || [];
    const selected = getBlankValue(blankIdx);

    return (
      <span className="inline-block relative mx-1 align-middle">
        <select
          value={selected ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setBlankValue(blankIdx, val === "" ? null : Number(val));
          }}
          disabled={readOnly}
          className="inline-block min-w-[120px] px-3 py-1.5 pr-7 border rounded-md text-base font-medium focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-white appearance-none cursor-pointer shadow-sm hover:shadow"
          style={{
            borderColor:
              selected !== null && selected !== undefined
                ? "#303380"
                : "rgba(48, 51, 128, 0.2)",
            backgroundColor:
              selected !== null && selected !== undefined
                ? "rgba(48, 51, 128, 0.04)"
                : "white",
            color:
              selected !== null && selected !== undefined
                ? "#303380"
                : "rgba(107, 114, 128, 0.7)",
            verticalAlign: "baseline",
          }}
        >
          <option value="" disabled>
            Select...
          </option>
          {choices.map((choice: string, idx: number) => (
            <option key={idx} value={idx}>
              {choice}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="rgba(48, 51, 128, 0.6)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </span>
    );
  };

  const hasBlankMarker = /____+|___+/.test(promptText);

  if (hasBlankMarker) {
    const parts = promptText.split(/____+|___+/);
    return (
      <div className="text-base leading-relaxed" style={{ lineHeight: "1.7" }}>
        <QuestionImage imageUrl={imageUrl} />
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && <DropdownSelect blankIdx={index} />}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="text-base leading-relaxed" style={{ lineHeight: "1.7" }}>
      <QuestionImage imageUrl={imageUrl} />
      <span>{promptText}</span> <DropdownSelect blankIdx={0} />
    </div>
  );
}
