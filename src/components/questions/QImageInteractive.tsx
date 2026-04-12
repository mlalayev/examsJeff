"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export interface ImageInteractiveValue {
  selectedHotspotIds?: string[]; // Backward compatibility
  selectedElementIds?: string[];
  inputValues?: Record<string, string>; // element.id -> user's typed answer
  radioSelections?: Record<string, string>; // groupName -> selected element.id
  checkboxSelections?: string[]; // Array of selected checkbox element IDs
}

type ElementType = "hotspot" | "input" | "radio" | "checkbox";

interface InteractiveElement {
  id: string;
  type?: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  placeholder?: string;
  groupName?: string;
}

export function QImageInteractive({ 
  question, 
  value, 
  onChange, 
  readOnly 
}: BaseQuestionProps<ImageInteractiveValue>) {
  const backgroundImage = question.prompt?.backgroundImage;
  const interactionType = question.prompt?.interactionType || "single";
  
  // Support both old format (hotspots) and new format (elements)
  const elements = (question.options?.elements || question.options?.hotspots || []) as InteractiveElement[];
  
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Initialize value object
  const currentValue: ImageInteractiveValue = value || {
    selectedElementIds: [],
    inputValues: {},
    radioSelections: {},
    checkboxSelections: [],
  };

  // Normalize image URL - handle both base64 and server paths
  const getImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return "";
    
    // If it's already a base64 data URL, return as-is
    if (imagePath.startsWith("data:")) {
      return imagePath;
    }
    
    // If it's already a full URL (http/https), return as-is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    
    // If it starts with /api/images/ or /images/, make it absolute
    if (imagePath.startsWith("/")) {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${imagePath}`;
      }
      return imagePath;
    }
    
    // Fallback: treat as relative path
    return imagePath;
  };

  const imageUrl = getImageUrl(backgroundImage);

  const handleHotspotClick = (element: InteractiveElement) => {
    if (readOnly) return;

    const selectedIds = currentValue.selectedElementIds || currentValue.selectedHotspotIds || [];
    let newSelectedIds: string[];
    
    if (interactionType === "single") {
      newSelectedIds = [element.id];
    } else {
      if (selectedIds.includes(element.id)) {
        newSelectedIds = selectedIds.filter((id: string) => id !== element.id);
      } else {
        newSelectedIds = [...selectedIds, element.id];
      }
    }

    onChange({
      ...currentValue,
      selectedElementIds: newSelectedIds,
      selectedHotspotIds: newSelectedIds, // Backward compatibility
    });
  };

  const handleRadioClick = (element: InteractiveElement) => {
    if (readOnly || !element.groupName) return;

    const radioSelections = { ...currentValue.radioSelections };
    radioSelections[element.groupName] = element.id;

    onChange({
      ...currentValue,
      radioSelections,
    });
  };

  const handleCheckboxClick = (element: InteractiveElement) => {
    if (readOnly) return;

    const checkboxSelections = currentValue.checkboxSelections || [];
    let newSelections: string[];

    if (checkboxSelections.includes(element.id)) {
      newSelections = checkboxSelections.filter((id: string) => id !== element.id);
    } else {
      newSelections = [...checkboxSelections, element.id];
    }

    onChange({
      ...currentValue,
      checkboxSelections: newSelections,
    });
  };

  const handleInputChange = (element: InteractiveElement, inputValue: string) => {
    if (readOnly) return;

    const inputValues = { ...currentValue.inputValues };
    inputValues[element.id] = inputValue;

    onChange({
      ...currentValue,
      inputValues,
    });
  };

  const getElementColor = (element: InteractiveElement) => {
    const type = element.type || "hotspot";
    
    if (type === "input") return { border: "#3B82F6", bg: "rgba(59, 130, 246, 0.15)" };
    if (type === "radio") return { border: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)" };
    if (type === "checkbox") return { border: "#EC4899", bg: "rgba(236, 72, 153, 0.15)" };
    
    // Hotspot
    return { border: "#303380", bg: "rgba(48, 51, 128, 0.15)" };
  };

  const isElementSelected = (element: InteractiveElement): boolean => {
    const type = element.type || "hotspot";
    
    if (type === "hotspot") {
      const selectedIds = currentValue.selectedElementIds || currentValue.selectedHotspotIds || [];
      return selectedIds.includes(element.id);
    }
    if (type === "radio" && element.groupName) {
      return currentValue.radioSelections?.[element.groupName] === element.id;
    }
    if (type === "checkbox") {
      return currentValue.checkboxSelections?.includes(element.id) || false;
    }
    
    return false;
  };

  if (!backgroundImage) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
        No background image provided for this question.
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="font-medium mb-2">Failed to load image</p>
        <p className="text-xs text-red-500">Image path: {backgroundImage}</p>
        <p className="text-xs text-red-500 mt-1">Attempted URL: {imageUrl}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Instructions:</strong> Interact with the elements on the image below. 
        {interactionType === "single" && " Select one correct answer."}
        {interactionType === "multiple" && " You can select multiple answers."}
      </div>

      {/* Interactive Image */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden inline-block max-w-full">
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Interactive Question"
            className="max-w-full h-auto"
            style={{ maxHeight: "600px", display: "block" }}
            draggable={false}
            onError={(e) => {
              console.error("Failed to load interactive image:", imageUrl);
              console.error("Original path:", backgroundImage);
              setImageError(true);
            }}
            onLoad={() => {
              console.log("Interactive image loaded successfully:", imageUrl);
            }}
          />
          
          {/* Render interactive elements */}
          {elements.map((element: InteractiveElement) => {
            const type = element.type || "hotspot";
            const isSelected = isElementSelected(element);
            const isHovered = hoveredElementId === element.id;
            const colors = getElementColor(element);

            return (
              <div
                key={element.id}
                className="absolute transition-all"
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  height: `${element.height}%`,
                  pointerEvents: type === "input" || readOnly ? "auto" : "auto",
                }}
                onMouseEnter={() => setHoveredElementId(element.id)}
                onMouseLeave={() => setHoveredElementId(null)}
              >
                {/* Hotspot */}
                {type === "hotspot" && (
                  <div
                    className="w-full h-full cursor-pointer"
                    style={{
                      border: isSelected 
                        ? "3px solid #303380" 
                        : isHovered 
                          ? `2px solid ${colors.border}` 
                          : `2px solid ${colors.border}80`,
                      backgroundColor: isSelected 
                        ? "rgba(48, 51, 128, 0.3)" 
                        : isHovered 
                          ? "rgba(48, 51, 128, 0.15)" 
                          : colors.bg,
                    }}
                    onClick={() => handleHotspotClick(element)}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: "#303380" }}
                        >
                          <svg 
                            className="w-5 h-5 text-white" 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="3" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Input */}
                {type === "input" && (
                  <input
                    type="text"
                    value={currentValue.inputValues?.[element.id] || ""}
                    onChange={(e) => handleInputChange(element, e.target.value)}
                    placeholder={element.placeholder || "Type here..."}
                    disabled={readOnly}
                    className="w-full h-full px-2 py-1 text-xs border-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: "white",
                    }}
                  />
                )}

                {/* Radio Button */}
                {type === "radio" && (
                  <div
                    className="w-full h-full cursor-pointer flex items-center justify-center"
                    style={{
                      border: isSelected 
                        ? `3px solid ${colors.border}` 
                        : `2px solid ${colors.border}`,
                      backgroundColor: isSelected 
                        ? colors.bg 
                        : "transparent",
                      borderRadius: "50%",
                    }}
                    onClick={() => handleRadioClick(element)}
                  >
                    {isSelected && (
                      <div 
                        className="w-1/2 h-1/2 rounded-full"
                        style={{ backgroundColor: colors.border }}
                      ></div>
                    )}
                  </div>
                )}

                {/* Checkbox */}
                {type === "checkbox" && (
                  <div
                    className="w-full h-full cursor-pointer flex items-center justify-center"
                    style={{
                      border: isSelected 
                        ? `3px solid ${colors.border}` 
                        : `2px solid ${colors.border}`,
                      backgroundColor: isSelected 
                        ? colors.border 
                        : "white",
                      borderRadius: "4px",
                    }}
                    onClick={() => handleCheckboxClick(element)}
                  >
                    {isSelected && (
                      <svg 
                        className="w-4/5 h-4/5 text-white" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="3" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                )}

                {/* Label badge */}
                <div
                  className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-sm"
                  style={{
                    backgroundColor: isSelected || isHovered ? colors.border : `${colors.border}CC`,
                    color: "white",
                    display: type === "input" ? "none" : "block",
                  }}
                >
                  {element.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary of selections */}
      <div className="text-sm space-y-2">
        {/* Hotspot selections */}
        {(() => {
          const selectedIds = currentValue.selectedElementIds || currentValue.selectedHotspotIds || [];
          const selectedHotspots = elements.filter(e => 
            (!e.type || e.type === "hotspot") && selectedIds.includes(e.id)
          );
          return selectedHotspots.length > 0 ? (
            <div>
              <p className="text-gray-600 mb-1"><strong>Selected:</strong></p>
              <div className="flex flex-wrap gap-2">
                {selectedHotspots.map((element) => (
                  <span 
                    key={element.id} 
                    className="px-3 py-1 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: "#303380" }}
                  >
                    {element.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Input values */}
        {Object.keys(currentValue.inputValues || {}).length > 0 && (
          <div>
            <p className="text-gray-600 mb-1"><strong>Your answers:</strong></p>
            <div className="space-y-1 text-xs">
              {elements
                .filter(e => e.type === "input" && currentValue.inputValues?.[e.id])
                .map((element) => (
                  <div key={element.id}>
                    <span className="font-medium">{element.label}:</span> {currentValue.inputValues?.[element.id]}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
