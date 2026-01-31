"use client";

import React from "react";
import { parseFormattedText } from "@/lib/text-formatter";

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with custom formatting applied
 * Supports: **bold**, __underline__, ~~strikethrough~~, &&italic&&
 */
export default function FormattedText({ text, className = "" }: FormattedTextProps) {
  const segments = parseFormattedText(text);

  const getSegmentClassName = (segment: any) => {
    const classes: string[] = [];
    if (segment.bold) classes.push("font-bold");
    if (segment.underline) classes.push("underline");
    if (segment.strikethrough) classes.push("line-through");
    if (segment.italic) classes.push("italic");
    return classes.join(" ");
  };

  return (
    <span className={className}>
      {segments.map((segment, idx) => (
        <span key={idx} className={getSegmentClassName(segment)}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}


