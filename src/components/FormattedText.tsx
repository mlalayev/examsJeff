"use client";

import React from "react";
import { parseFormattedText } from "@/lib/text-formatter";
import katex from 'katex';
import { splitMathText } from '@/lib/math-text';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with custom formatting applied
 * Supports: **bold**, __underline__, --strikethrough--, ~~italic~~
 */
export default function FormattedText({ text, className = "" }: FormattedTextProps) {
  const parts = splitMathText(String(text ?? ''));

  const getSegmentClassName = (segment: any) => {
    const classes: string[] = [];
    if (segment.bold) classes.push("font-bold");
    if (segment.underline) classes.push("underline");
    if (segment.strikethrough) classes.push("line-through");
    if (segment.italic) classes.push("italic");
    if (segment.gray) classes.push("text-slate-500");
    return classes.join(" ");
  };

  return (
    <span className={`whitespace-pre-wrap ${className}`.trim()}>
      {parts.map((part, partIndex) => part.math ? <span key={partIndex}
        className={part.display ? 'exam-math-display' : 'exam-math-inline'}
        dangerouslySetInnerHTML={{ __html: katex.renderToString(part.text, {
          displayMode: part.display, throwOnError: false, trust: false,
          strict: 'ignore', maxExpand: 500, maxSize: 10, output: 'htmlAndMathml',
        }) }} /> : <React.Fragment key={partIndex}>{parseFormattedText(part.text.replace(/\\\$/g, '$')).map((segment, idx) => (
        <span key={idx} className={getSegmentClassName(segment)}>
          {segment.text}
        </span>
      ))}</React.Fragment>)}
    </span>
  );
}


