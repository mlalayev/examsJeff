"use client";

import { BaseQuestionProps } from "./types";
import { useState } from "react";

export interface ImageInteractiveValue {
  selectedHotspotIds: string[];
}

export function QImageInteractive({ 
  question, 
  value, 
  onChange, 
  readOnly 
}: BaseQuestionProps<ImageInteractiveValue>) {
  const backgroundImage = question.prompt?.backgroundImage;
  const interactionType = question.prompt?.interactionType || "single";
  const hotspots = question.options?.hotspots || [];
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  const selectedIds = value?.selectedHotspotIds || [];

  const handleHotspotClick = (hotspotId: string) => {
    if (readOnly) return;

    let newSelectedIds: string[];
    
    if (interactionType === "single") {
      // Single selection: replace selection
      newSelectedIds = [hotspotId];
    } else {
      // Multiple selection: toggle selection
      if (selectedIds.includes(hotspotId)) {
        newSelectedIds = selectedIds.filter((id: string) => id !== hotspotId);
      } else {
        newSelectedIds = [...selectedIds, hotspotId];
      }
    }

    onChange({ selectedHotspotIds: newSelectedIds });
  };

  if (!backgroundImage) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
        No background image provided for this question.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <strong>Instructions:</strong> {interactionType === "single" 
          ? "Click on the correct area in the image." 
          : "Click on all correct areas in the image."}
      </div>

      {/* Interactive Image */}
      <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden inline-block max-w-full">
        <div className="relative inline-block">
          <img
            src={backgroundImage}
            alt="Interactive Question"
            className="max-w-full h-auto"
            style={{ maxHeight: "600px", display: "block" }}
            draggable={false}
          />
          {/* Render hotspots */}
          {hotspots.map((hotspot: any) => {
            const isSelected = selectedIds.includes(hotspot.id);
            const isHovered = hoveredHotspotId === hotspot.id;

            return (
              <div
                key={hotspot.id}
                className="absolute cursor-pointer transition-all"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                  border: isSelected 
                    ? "3px solid #303380" 
                    : isHovered 
                      ? "2px solid #5b5fb8" 
                      : "2px solid rgba(48, 51, 128, 0.3)",
                  backgroundColor: isSelected 
                    ? "rgba(48, 51, 128, 0.3)" 
                    : isHovered 
                      ? "rgba(48, 51, 128, 0.15)" 
                      : "rgba(48, 51, 128, 0.05)",
                  pointerEvents: readOnly ? "none" : "auto",
                }}
                onClick={() => handleHotspotClick(hotspot.id)}
                onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                onMouseLeave={() => setHoveredHotspotId(null)}
                title={hotspot.label}
              >
                {/* Label badge */}
                <div
                  className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 rounded whitespace-nowrap shadow-sm"
                  style={{
                    backgroundColor: isSelected ? "#303380" : isHovered ? "#5b5fb8" : "#6366f1",
                    color: "white",
                  }}
                >
                  {hotspot.label}
                </div>

                {/* Selection indicator */}
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
            );
          })}
        </div>
      </div>

      {/* Selected areas summary */}
      {selectedIds.length > 0 && (
        <div className="text-sm">
          <p className="text-gray-600 mb-2">
            <strong>Selected:</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id: string) => {
              const hotspot = hotspots.find((h: any) => h.id === id);
              return hotspot ? (
                <span 
                  key={id} 
                  className="px-3 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: "#303380" }}
                >
                  {hotspot.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
