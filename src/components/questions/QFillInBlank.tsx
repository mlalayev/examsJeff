"use client";

import React from "react";
import FormattedText from "../FormattedText";

interface QFillInBlankProps {
  prompt: {
    text: string;
    imageUrl?: string;
  };
  image?: string; // Question-level image
  value: Record<string, string>; // { "0": "answer1", "1": "answer2", ... }
  onChange: (value: Record<string, string>) => void;
}

/**
 * IELTS Fill in the Blank Question Component
 * 
 * NEW Format:
 * Title line (optional, before ---)
 * ---
 * 1. Text with blank ___
 * 2. Another text ___
 * 
 * Example prompt.text:
 * "Complete the sentences below:\n---\n1. A wooden ___\n2. Includes a sheet of ___\n3. Price: £___"
 * 
 * This will render:
 * Title: "Complete the sentences below:"
 * Then each line as: "1. A wooden ___" + [Input field]
 */
export default function QFillInBlank({ prompt, image, value, onChange }: QFillInBlankProps) {
  const text = prompt?.text || "";
  const imageUrl = image || prompt?.imageUrl;

  // Split by --- to separate title from items
  const [titlePart = "", itemsPart = ""] = text.split("---").map(s => s.trim());
  
  // Split items by newline
  const items = itemsPart.split("\n").filter(line => line.trim());
  
  // Count how many items have ___
  const blankCount = items.filter(item => item.includes("___")).length;

  const handleChange = (index: number, newValue: string) => {
    onChange({
      ...value,
      [String(index)]: newValue,
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      {titlePart && (
        <div className="mb-4 text-base font-medium text-gray-900">
          <FormattedText text={titlePart} />
        </div>
      )}

      {/* Image (full width if exists) */}
      {imageUrl && (
        <div className="w-full mb-6">
          <img
            src={imageUrl}
            alt="Question illustration"
            className="w-full max-w-3xl mx-auto h-auto rounded-lg border-2 border-gray-200 shadow-sm"
          />
        </div>
      )}

      {/* Items with inputs */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const hasBlank = item.includes("___");
          
          return (
            <div key={index} className="space-y-2">
              {/* Item text */}
              <div className="text-gray-800">
                <FormattedText text={item} />
              </div>
              
              {/* Input field if this item has a blank */}
              {hasBlank && (
                <input
                  type="text"
                  value={value[String(index)] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  style={{ width: "240px" }}
                  placeholder={`Answer ${index + 1}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Case-insensitive info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Note:</strong> Answers are not case-sensitive. "train", "Train", and "TRAIN" are all accepted.
        </p>
      </div>
    </div>
  );
}



