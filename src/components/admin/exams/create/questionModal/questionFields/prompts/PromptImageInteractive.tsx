"use client";

import { Question } from "../../../types";
import { Plus, X } from "lucide-react";

interface PromptImageInteractiveProps {
  question: Question;
  onChange: (question: Question) => void;
  uploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  showAlert: (title: string, message: string, type: "error" | "warning" | "info") => void;
}

type ElementType = "hotspot" | "input" | "radio" | "checkbox";

interface InteractiveElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  isCorrect?: boolean;
  correctAnswer?: string; // For input fields
  placeholder?: string; // For input fields
  groupName?: string; // For radio buttons in same group
}

export function PromptImageInteractive({
  question,
  onChange,
  uploadingImage,
  onImageUpload,
  showAlert,
}: PromptImageInteractiveProps) {
  const elements = (question.options?.elements || question.options?.hotspots || []) as InteractiveElement[];

  const addElement = (type: ElementType) => {
    const newElement: InteractiveElement = {
      id: `element-${Date.now()}`,
      type,
      x: 10,
      y: 10 + (elements.length * 5), // Offset each new element
      width: type === "input" ? 30 : 20,
      height: type === "input" ? 8 : 15,
      label: type === "hotspot" ? `Area ${elements.length + 1}` : 
             type === "input" ? `Input ${elements.length + 1}` :
             type === "radio" ? `Option ${elements.length + 1}` :
             `Checkbox ${elements.length + 1}`,
      isCorrect: type === "hotspot" || type === "radio" || type === "checkbox" ? false : undefined,
      correctAnswer: type === "input" ? "" : undefined,
      placeholder: type === "input" ? "Type answer here..." : undefined,
      groupName: type === "radio" ? "group1" : undefined,
    };

    onChange({
      ...question,
      options: {
        ...question.options,
        elements: [...elements, newElement],
        // Keep backward compatibility
        hotspots: undefined,
      },
    });
  };

  const updateElement = (idx: number, updates: Partial<InteractiveElement>) => {
    const newElements = [...elements];
    newElements[idx] = { ...newElements[idx], ...updates };
    onChange({
      ...question,
      options: { ...question.options, elements: newElements },
    });
  };

  const deleteElement = (idx: number) => {
    const elementId = elements[idx].id;
    const newElements = [...elements];
    newElements.splice(idx, 1);
    
    // Update answer key
    const correctIds = (question.answerKey?.correctHotspotIds || question.answerKey?.correctElementIds || [])
      .filter((id: string) => id !== elementId);
    
    onChange({
      ...question,
      options: { ...question.options, elements: newElements },
      answerKey: {
        ...question.answerKey,
        correctElementIds: correctIds,
        correctHotspotIds: undefined, // Migrate to new format
      },
    });
  };

  const toggleCorrect = (idx: number) => {
    const element = elements[idx];
    const correctIds = question.answerKey?.correctElementIds || question.answerKey?.correctHotspotIds || [];
    
    let newCorrectIds: string[];
    const isCurrentlyCorrect = correctIds.includes(element.id);
    
    if (isCurrentlyCorrect) {
      newCorrectIds = correctIds.filter((id: string) => id !== element.id);
    } else {
      // For radio buttons in same group, only one can be correct
      if (element.type === "radio" && element.groupName) {
        // Remove other radio buttons from same group
        const sameGroupIds = elements
          .filter(e => e.type === "radio" && e.groupName === element.groupName)
          .map(e => e.id);
        newCorrectIds = correctIds.filter((id: string) => !sameGroupIds.includes(id));
        newCorrectIds.push(element.id);
      } else if (question.prompt?.interactionType === "single") {
        newCorrectIds = [element.id];
      } else {
        newCorrectIds = [...correctIds, element.id];
      }
    }

    updateElement(idx, { isCorrect: !isCurrentlyCorrect });
    onChange({
      ...question,
      answerKey: {
        ...question.answerKey,
        correctElementIds: newCorrectIds,
        correctHotspotIds: undefined,
      },
    });
  };

  const getElementColor = (element: InteractiveElement) => {
    if (element.type === "input") return { border: "#3B82F6", bg: "rgba(59, 130, 246, 0.2)" };
    if (element.type === "radio") return { border: "#8B5CF6", bg: "rgba(139, 92, 246, 0.2)" };
    if (element.type === "checkbox") return { border: "#EC4899", bg: "rgba(236, 72, 153, 0.2)" };
    return element.isCorrect 
      ? { border: "#10B981", bg: "rgba(16, 185, 129, 0.2)" }
      : { border: "#EF4444", bg: "rgba(239, 68, 68, 0.2)" };
  };

  const getElementIcon = (type: ElementType) => {
    switch (type) {
      case "input": return "📝";
      case "radio": return "🔘";
      case "checkbox": return "☑️";
      default: return "🎯";
    }
  };

  return (
    <div className="space-y-3">
      {/* Question Text */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Question Text *
        </label>
        <textarea
          value={question.prompt?.text || ""}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: { ...question.prompt, text: e.target.value },
            });
          }}
          placeholder="Enter the question text (e.g., 'Click on the correct body part', 'Label the parts of the diagram')"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
          rows={2}
        />
      </div>

      {/* Interaction Type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Interaction Type *
        </label>
        <select
          value={question.prompt?.interactionType || "single"}
          onChange={(e) => {
            onChange({
              ...question,
              prompt: { ...question.prompt, interactionType: e.target.value },
            });
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 bg-white"
        >
          <option value="single">Single Selection (Only one correct answer)</option>
          <option value="multiple">Multiple Selection (Multiple correct answers)</option>
        </select>
      </div>

      {/* Background Image Upload */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Background Image *
        </label>
        {question.prompt?.backgroundImage ? (
          <div className="mb-2 relative inline-block">
            <img
              src={question.prompt.backgroundImage}
              alt="Background"
              className="max-w-full h-auto max-h-64 rounded border border-gray-200"
              onError={(e) => {
                console.error("Failed to load image:", question.prompt.backgroundImage);
                e.currentTarget.style.display = 'none';
                const errorMsg = e.currentTarget.parentElement?.querySelector('.image-error');
                if (errorMsg) errorMsg.classList.remove('hidden');
              }}
            />
            <div className="image-error hidden text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-2">
              Failed to load image. Path: {question.prompt.backgroundImage}
            </div>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...question,
                  prompt: { ...question.prompt, backgroundImage: "" },
                  options: { elements: [] },
                  answerKey: { correctElementIds: [] },
                });
              }}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="mb-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            No image uploaded yet. Please select an image file below.
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await onImageUpload(file);
            }
          }}
          disabled={uploadingImage}
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50 bg-white"
        />
        {uploadingImage && (
          <p className="text-xs text-gray-500 mt-1">Uploading image...</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Upload an image where students will interact with elements (click, type, select).
        </p>
      </div>

      {/* Interactive Elements Editor */}
      {question.prompt?.backgroundImage && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Interactive Elements
          </label>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            {/* Interactive Image Editor */}
            <div className="relative inline-block bg-white border-2 border-gray-300 rounded-md overflow-hidden mb-3">
              <img
                src={question.prompt.backgroundImage}
                alt="Interactive"
                className="max-w-full h-auto"
                style={{ maxHeight: "500px" }}
                draggable={false}
                onError={(e) => {
                  console.error("Failed to load editor image:", question.prompt.backgroundImage);
                }}
              />
              {/* Render interactive elements */}
              {elements.map((element: InteractiveElement) => {
                const colors = getElementColor(element);
                return (
                  <div
                    key={element.id}
                    className="absolute border-2 cursor-pointer transition-all"
                    style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      width: `${element.width}%`,
                      height: `${element.height}%`,
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    }}
                  >
                    <div 
                      className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 rounded whitespace-nowrap" 
                      style={{
                        backgroundColor: colors.border,
                        color: "white",
                      }}
                    >
                      {getElementIcon(element.type)} {element.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Element Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => addElement("hotspot")}
                className="px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-100 text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Clickable Area
              </button>
              <button
                type="button"
                onClick={() => addElement("input")}
                className="px-3 py-2 border border-dashed border-blue-300 rounded-md text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Text Input
              </button>
              <button
                type="button"
                onClick={() => addElement("radio")}
                className="px-3 py-2 border border-dashed border-purple-300 rounded-md text-purple-600 hover:border-purple-400 hover:bg-purple-50 text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Radio Button
              </button>
              <button
                type="button"
                onClick={() => addElement("checkbox")}
                className="px-3 py-2 border border-dashed border-pink-300 rounded-md text-pink-600 hover:border-pink-400 hover:bg-pink-50 text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Checkbox
              </button>
            </div>

            {/* Elements List */}
            {elements.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Configure Elements:</p>
                {elements.map((element: InteractiveElement, idx: number) => (
                  <div key={element.id} className="bg-white p-3 rounded border border-gray-200 space-y-2">
                    {/* Header with Type and Delete */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="text-sm">
                        {getElementIcon(element.type)}
                      </span>
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {element.type}
                      </span>
                      <div className="flex-1"></div>
                      <button
                        type="button"
                        onClick={() => deleteElement(idx)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Label */}
                    <div>
                      <label className="text-xs text-gray-500">Label</label>
                      <input
                        type="text"
                        value={element.label}
                        onChange={(e) => updateElement(idx, { label: e.target.value })}
                        placeholder="Element label"
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                      />
                    </div>

                    {/* Position and Size */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">X (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={element.x}
                          onChange={(e) => updateElement(idx, { x: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Y (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={element.y}
                          onChange={(e) => updateElement(idx, { y: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Width (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={element.width}
                          onChange={(e) => updateElement(idx, { width: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Height (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={element.height}
                          onChange={(e) => updateElement(idx, { height: parseFloat(e.target.value) || 1 })}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                        />
                      </div>
                    </div>

                    {/* Type-specific fields */}
                    {element.type === "input" && (
                      <>
                        <div>
                          <label className="text-xs text-gray-500">Placeholder Text</label>
                          <input
                            type="text"
                            value={element.placeholder || ""}
                            onChange={(e) => updateElement(idx, { placeholder: e.target.value })}
                            placeholder="e.g., Type your answer..."
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Correct Answer *</label>
                          <input
                            type="text"
                            value={element.correctAnswer || ""}
                            onChange={(e) => updateElement(idx, { correctAnswer: e.target.value })}
                            placeholder="e.g., heart"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                          />
                          <p className="text-xs text-gray-400 mt-1">Student's answer will be checked against this (case-insensitive)</p>
                        </div>
                      </>
                    )}

                    {element.type === "radio" && (
                      <div>
                        <label className="text-xs text-gray-500">Radio Group Name</label>
                        <input
                          type="text"
                          value={element.groupName || ""}
                          onChange={(e) => updateElement(idx, { groupName: e.target.value })}
                          placeholder="e.g., group1"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs mt-1"
                        />
                        <p className="text-xs text-gray-400 mt-1">Radio buttons with same group name work together (only one can be selected)</p>
                      </div>
                    )}

                    {/* Mark as correct (for clickable elements, not inputs) */}
                    {element.type !== "input" && (
                      <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-gray-100">
                        <input
                          type="checkbox"
                          checked={element.isCorrect || false}
                          onChange={() => toggleCorrect(idx)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          Mark as Correct Answer
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}

            {elements.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                Add interactive elements to the image using the buttons above
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Add different types of interactive elements on the image: clickable areas, text inputs, radio buttons, or checkboxes. Configure their positions and correct answers.
          </p>
        </div>
      )}
    </div>
  );
}
