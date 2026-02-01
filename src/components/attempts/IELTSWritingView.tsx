"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FormattedText } from "../FormattedText";
import { ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface WritingTask {
  id: string;
  title: string;
  instruction: string;
  minWords: number;
  suggestedTime: number;
  questions: any[]; // Empty or minimal questions array
}

interface IELTSWritingViewProps {
  attemptId: string;
  taskSections: WritingTask[];
  writingType: "ACADEMIC" | "GENERAL";
  answers: Record<string, any>; // answers[sectionId] = { task1: "text", task2: "text" }
  isLocked: boolean;
  onAnswerChange: (sectionId: string, taskKey: string, value: string) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 500;

export function IELTSWritingView({
  attemptId,
  taskSections,
  writingType,
  answers,
  isLocked,
  onAnswerChange,
}: IELTSWritingViewProps) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [hasStartedTask2, setHasStartedTask2] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `ielts_attempt:${attemptId}:writing`;

  // Get current task section
  const currentTask = taskSections[currentTaskIndex];
  
  // Get task text from answers (use unique ID per task)
  const task1Section = taskSections[0];
  const task2Section = taskSections[1];
  const task1Text = answers[task1Section?.id]?.["writing_text"] || "";
  const task2Text = answers[task2Section?.id]?.["writing_text"] || "";

  // Load saved state on mount (for currentTaskIndex and hasStartedTask2)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCurrentTaskIndex(parsed.currentTaskIndex || 0);
        setHasStartedTask2(parsed.hasStartedTask2 || false);
        console.log("✅ Writing view state restored from localStorage");
      }
    } catch (error) {
      console.error("Failed to restore writing view state:", error);
    }
  }, [attemptId, storageKey]);

  // Save UI state to localStorage (debounced)
  const saveUIStateToStorage = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      try {
        const dataToSave = {
          currentTaskIndex,
          hasStartedTask2,
          lastSaved: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save writing UI state:", error);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [currentTaskIndex, hasStartedTask2, storageKey]);

  // Auto-save UI state on changes
  useEffect(() => {
    saveUIStateToStorage();
  }, [currentTaskIndex, saveUIStateToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  const currentText = currentTaskIndex === 0 ? task1Text : task2Text;
  const setCurrentText = (value: string) => {
    const sectionId = currentTaskIndex === 0 ? task1Section.id : task2Section.id;
    onAnswerChange(sectionId, "writing_text", value);
    setLastSaved(new Date());
  };

  const wordCount = currentText.trim().split(/\s+/).filter((word) => word.length > 0).length;
  const minWords = currentTaskIndex === 0 ? 150 : 250;
  const suggestedTime = currentTaskIndex === 0 ? 20 : 40;

  const goToTask2 = () => {
    if (!hasStartedTask2) {
      setHasStartedTask2(true);
    }
    setCurrentTaskIndex(1);
  };

  const goToTask1 = () => {
    setCurrentTaskIndex(0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              IELTS Writing {writingType === "ACADEMIC" ? "(Academic)" : "(General Training)"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Task {currentTaskIndex + 1} of 2 • Minimum {minWords} words
            </p>
          </div>
          
          {lastSaved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Task Navigation Tabs */}
      <div className="bg-white border-b px-6 py-2 flex gap-4">
        <button
          onClick={goToTask1}
          disabled={isLocked}
          className={`px-4 py-2 font-medium transition-colors ${
            currentTaskIndex === 0
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Task 1
        </button>
        <button
          onClick={goToTask2}
          disabled={isLocked || (!hasStartedTask2 && currentTaskIndex === 0)}
          className={`px-4 py-2 font-medium transition-colors ${
            currentTaskIndex === 1
              ? "text-blue-600 border-b-2 border-blue-600"
              : hasStartedTask2
              ? "text-gray-600 hover:text-gray-800"
              : "text-gray-400 cursor-not-allowed"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Task 2 {!hasStartedTask2 && <span className="text-xs ml-1">(Start Task 1 first)</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-8">
          {/* Task Instruction */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h3 className="font-bold text-lg mb-2 text-gray-800">
              {currentTask.title}
            </h3>
            <div className="text-gray-700 prose prose-sm max-w-none">
              <FormattedText text={currentTask.instruction} />
            </div>
            <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Write at least <strong>{minWords} words</strong>. 
                Suggested time: <strong>{suggestedTime} minutes</strong>.
              </span>
            </div>
          </div>

          {/* Writing Area */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Answer:
              </label>
              <span className={`text-sm font-medium ${
                wordCount >= minWords ? 'text-green-600' : 'text-orange-600'
              }`}>
                {wordCount} / {minWords} words
              </span>
            </div>
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder={`Start writing your ${currentTask.title.toLowerCase()} here...`}
              className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans text-base leading-relaxed"
              disabled={isLocked}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            {currentTaskIndex === 0 ? (
              <div className="text-sm text-gray-500">
                Complete Task 1 before moving to Task 2
              </div>
            ) : (
              <button
                onClick={goToTask1}
                disabled={isLocked}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Task 1
              </button>
            )}

            {currentTaskIndex === 0 && (
              <button
                onClick={goToTask2}
                disabled={isLocked}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Task 2
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

