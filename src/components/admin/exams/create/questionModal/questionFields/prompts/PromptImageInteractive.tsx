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

export function PromptImageInteractive({
  question,
  onChange,
  uploadingImage,
  onImageUpload,
  showAlert,
}: PromptImageInteractiveProps) {
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
          placeholder="Enter the question text (e.g., 'Click on the correct body part', 'Select all items in the living room')"
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
              onLoad={() => {
                console.log("Image loaded successfully:", question.prompt.backgroundImage);
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
                  options: { hotspots: [] },
                  answerKey: { correctHotspotIds: [] },
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
              console.log("Uploading file:", file.name, "Size:", file.size);
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
          Upload an image where students will click/select areas. This will be the background.
        </p>
      </div>

      {/* Hotspot Editor */}
      {question.prompt?.backgroundImage && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Clickable Areas (Hotspots)
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
                  console.error("Failed to load hotspot editor image:", question.prompt.backgroundImage);
                }}
              />
              {/* Render hotspots */}
              {(question.options?.hotspots || []).map((hotspot: any) => (
                <div
                  key={hotspot.id}
                  className="absolute border-2 cursor-pointer transition-all"
                  style={{
                    left: `${hotspot.x}%`,
                    top: `${hotspot.y}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                    borderColor: hotspot.isCorrect ? "#10B981" : "#EF4444",
                    backgroundColor: hotspot.isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs font-medium px-2 py-1 rounded" style={{
                    backgroundColor: hotspot.isCorrect ? "#10B981" : "#EF4444",
                    color: "white",
                  }}>
                    {hotspot.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Hotspot Button */}
            <button
              type="button"
              onClick={() => {
                const newHotspot = {
                  id: `hotspot-${Date.now()}`,
                  x: 10,
                  y: 10,
                  width: 20,
                  height: 15,
                  label: `Area ${(question.options?.hotspots || []).length + 1}`,
                  isCorrect: false,
                };
                onChange({
                  ...question,
                  options: {
                    ...question.options,
                    hotspots: [...(question.options?.hotspots || []), newHotspot],
                  },
                });
              }}
              className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:bg-gray-100 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Clickable Area
            </button>

            {/* Hotspots List */}
            {(question.options?.hotspots || []).length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Configure Areas:</p>
                {(question.options?.hotspots || []).map((hotspot: any, idx: number) => (
                  <div key={hotspot.id} className="bg-white p-3 rounded border border-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={hotspot.label}
                        onChange={(e) => {
                          const newHotspots = [...(question.options?.hotspots || [])];
                          newHotspots[idx] = { ...hotspot, label: e.target.value };
                          onChange({
                            ...question,
                            options: { ...question.options, hotspots: newHotspots },
                          });
                        }}
                        placeholder="Area label"
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newHotspots = [...(question.options?.hotspots || [])];
                          newHotspots.splice(idx, 1);
                          onChange({
                            ...question,
                            options: { ...question.options, hotspots: newHotspots },
                            answerKey: {
                              correctHotspotIds: (question.answerKey?.correctHotspotIds || []).filter((id: string) => id !== hotspot.id),
                            },
                          });
                        }}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">X Position (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={hotspot.x}
                          onChange={(e) => {
                            const newHotspots = [...(question.options?.hotspots || [])];
                            newHotspots[idx] = { ...hotspot, x: parseFloat(e.target.value) || 0 };
                            onChange({
                              ...question,
                              options: { ...question.options, hotspots: newHotspots },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Y Position (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={hotspot.y}
                          onChange={(e) => {
                            const newHotspots = [...(question.options?.hotspots || [])];
                            newHotspots[idx] = { ...hotspot, y: parseFloat(e.target.value) || 0 };
                            onChange({
                              ...question,
                              options: { ...question.options, hotspots: newHotspots },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Width (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={hotspot.width}
                          onChange={(e) => {
                            const newHotspots = [...(question.options?.hotspots || [])];
                            newHotspots[idx] = { ...hotspot, width: parseFloat(e.target.value) || 1 };
                            onChange({
                              ...question,
                              options: { ...question.options, hotspots: newHotspots },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Height (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={hotspot.height}
                          onChange={(e) => {
                            const newHotspots = [...(question.options?.hotspots || [])];
                            newHotspots[idx] = { ...hotspot, height: parseFloat(e.target.value) || 1 };
                            onChange({
                              ...question,
                              options: { ...question.options, hotspots: newHotspots },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(question.answerKey?.correctHotspotIds || []).includes(hotspot.id)}
                        onChange={(e) => {
                          let correctIds = [...(question.answerKey?.correctHotspotIds || [])];
                          if (e.target.checked) {
                            if (question.prompt?.interactionType === "single") {
                              correctIds = [hotspot.id];
                            } else {
                              correctIds.push(hotspot.id);
                            }
                          } else {
                            correctIds = correctIds.filter((id: string) => id !== hotspot.id);
                          }
                          const newHotspots = [...(question.options?.hotspots || [])];
                          newHotspots[idx] = { ...hotspot, isCorrect: e.target.checked };
                          onChange({
                            ...question,
                            options: { ...question.options, hotspots: newHotspots },
                            answerKey: { correctHotspotIds: correctIds },
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-xs font-medium text-gray-700">Mark as Correct Answer</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Add clickable areas on the image. Configure position (X, Y) and size (Width, Height) as percentages. Mark correct answer(s).
          </p>
        </div>
      )}
    </div>
  );
}
