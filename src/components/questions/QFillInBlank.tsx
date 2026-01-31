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
 * Example prompt.text:
 * "A wooden **1** ___\nIncludes a sheet of **2** ___\nPrice: £**3** ___"
 * 
 * This will render:
 * - Image on the left (if provided)
 * - Text with input fields on the right
 * - Input fields replace "___" (3 underscores)
 * - **number** is rendered as bold number
 */
export default function QFillInBlank({ prompt, image, value, onChange }: QFillInBlankProps) {
  const text = prompt?.text || "";
  const imageUrl = image || prompt?.imageUrl;

  // Parse text and extract blanks
  // Split by ___ to get parts and blanks
  const parts = text.split("___");
  const blankCount = parts.length - 1;

  const handleChange = (index: number, newValue: string) => {
    onChange({
      ...value,
      [String(index)]: newValue,
    });
  };

  return (
    <div className="space-y-4">
      {/* Layout: Image left, Text + Inputs right */}
      <div className={`flex ${imageUrl ? "gap-6" : ""} items-start`}>
        {/* Image (if exists) */}
        {imageUrl && (
          <div className="flex-shrink-0 w-1/3">
            <img
              src={imageUrl}
              alt="Question illustration"
              className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
            />
          </div>
        )}

        {/* Text + Input fields */}
        <div className={`flex-1 ${imageUrl ? "w-2/3" : "w-full"}`}>
          <div className="space-y-3">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                {/* Render text part with formatting */}
                {part && (
                  <div className="inline">
                    <FormattedText text={part} />
                  </div>
                )}

                {/* Render input field if not last part */}
                {index < blankCount && (
                  <input
                    type="text"
                    value={value[String(index)] || ""}
                    onChange={(e) => handleChange(index, e.target.value)}
                    className="inline-block mx-2 px-3 py-2 border-2 border-gray-300 rounded-md text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    style={{
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                    placeholder={`Answer ${index + 1}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Case-sensitive warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Note:</strong> Answers are case-sensitive. Make sure to use the correct capitalization.
        </p>
      </div>
    </div>
  );
}



