"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface AssignExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classId: string;
  onSuccess: () => void;
}

interface Unit {
  id: string;
  title: string;
  track: string;
  createdAt: string;
}

export default function AssignExamModal({
  isOpen,
  onClose,
  student,
  classId,
  onSuccess,
}: AssignExamModalProps) {
  const [step, setStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const levels = ["A1", "A2", "B1", "B1+", "B2"];

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedLevel("");
      setSelectedUnit("");
      setUnits([]);
    }
  }, [isOpen]);

  // Fetch units when level is selected
  useEffect(() => {
    if (selectedLevel) {
      fetchUnits(selectedLevel);
    }
  }, [selectedLevel]);

  const fetchUnits = async (level: string) => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/catalog/ge-units?level=${level}`);
      const data = await res.json();
      if (res.ok) {
        setUnits(data.units || []);
      } else {
        console.error("Failed to fetch units:", data.error);
        setUnits([]);
      }
    } catch (err) {
      console.error("Error fetching units:", err);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
    setSelectedUnit("");
    setStep(2);
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setSelectedLevel("");
      } else if (step === 3) {
        setSelectedUnit("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedUnit) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          studentIds: [student.id],
          examId: selectedUnit,
          startAt: new Date().toISOString(),
          dueAt: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign exam");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Assignment error:", err);
      alert(err.message || "Failed to assign exam");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedUnitData = units.find((u) => u.id === selectedUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Assign Exam</h2>
            <p className="text-purple-100 text-sm mt-1">
              {student.name || student.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              1
            </div>
            <div
              className={`h-1 w-12 ${
                step >= 2 ? "bg-purple-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              2
            </div>
            <div
              className={`h-1 w-12 ${
                step >= 3 ? "bg-purple-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>Level</span>
            <span>Unit</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[300px]">
          {/* Step 1: Select Level */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Select Level
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
                    className="px-6 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-xl text-purple-700 font-semibold transition-all hover:scale-105 hover:shadow-md"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Unit */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Select Unit ({selectedLevel})
              </h3>
              {loadingUnits ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
              ) : units.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No units available for {selectedLevel}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {units.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleUnitSelect(unit.id)}
                      className="w-full text-left px-4 py-3 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg transition-all hover:shadow-sm flex items-center justify-between group"
                    >
                      <span className="font-medium text-slate-700 group-hover:text-purple-700">
                        {unit.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Confirm Assignment
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Student</span>
                  <p className="text-slate-800 font-medium">
                    {student.name || student.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Level</span>
                  <p className="text-slate-800 font-medium">{selectedLevel}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Exam</span>
                  <p className="text-slate-800 font-medium">
                    {selectedUnitData?.title}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Sections</span>
                  <p className="text-slate-600 text-sm">
                    All sections (Reading, Listening, Writing, Grammar, Vocabulary)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium flex items-center gap-2 transition-colors"
            disabled={submitting}
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Assigning...
                </>
              ) : (
                "Assign Exam"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

