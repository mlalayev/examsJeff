"use client";

import React from "react";
import FormattedText from "../FormattedText";

interface QFillInBlankProps {
  prompt: {
    text: string;
    title?: string; // NEW: Optional question title
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
 * 1. Text with blank [input]
 * 2. Another text [input]
 * 
 * Example prompt.text:
 * "Complete the sentences below:\n---\n1. A wooden [input]\n2. Includes a sheet of [input]\n3. Price: £[input]"
 * 
 * OR use prompt.title:
 * prompt.title = "Complete the form below"
 * prompt.text = "1. Name: [input]\n2. Age: [input]"
 * 
 * This will render:
 * Title: "Complete the sentences below:" (or prompt.title)
 * Then each line as: "1. A wooden [input]" + [Input field]
 */
export default function QFillInBlank({ prompt, image, value, onChange }: QFillInBlankProps) {
  const text = prompt?.text || "";
  const imageUrl = image || prompt?.imageUrl;
  const questionTitle = prompt?.title || ""; // NEW: Support title field

  // Split by --- to separate title from items
  const [titlePart = "", itemsPart = ""] = text.split("---").map(s => s.trim());
  
  // Use explicit title if provided, otherwise use titlePart from text
  const displayTitle = questionTitle || titlePart;
  
  // If we have explicit title, use full text as items; otherwise use itemsPart
  const itemsText = questionTitle ? text : itemsPart;
  
  // Split items by newline
  const items = itemsText.split("\n").filter(line => line.trim());
  
  // Support both ___ and [input] for blanks
  const normalizedItems = items.map(item => item.replace(/___/g, "[input]"));
  
  // Count how many items have [input]
  const blankCount = normalizedItems.filter(item => item.includes("[input]")).length;

  const handleChange = (blankIndex: number, newValue: string) => {
    onChange({
      ...value,
      [String(blankIndex)]: newValue,
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      {displayTitle && (
        <div className="mb-4 text-base font-medium text-gray-900">
          <FormattedText text={displayTitle} />
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
        {(() => {
          let blankCounter = 0;
          return normalizedItems.map((item, itemIndex) => {
            const hasBlank = item.includes("[input]");
            const currentBlankIndex = hasBlank ? blankCounter : -1;
            if (hasBlank) blankCounter++;
            
            return (
              <div key={itemIndex} className="space-y-2">
                {/* Item text - replace [input] with underline for display */}
                <div className="text-gray-800">
                  <FormattedText text={item.replace(/\[input\]/g, "___")} />
                </div>
                
                {/* Input field if this item has a blank */}
                {hasBlank && currentBlankIndex >= 0 && (
                  <input
                    type="text"
                    value={value[String(currentBlankIndex)] || ""}
                    onChange={(e) => handleChange(currentBlankIndex, e.target.value)}
                    className="px-3 py-2 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    style={{ width: "240px" }}
                    placeholder={`Answer ${currentBlankIndex + 1}`}
                  />
                )}
              </div>
            );
          });
        })()}
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



