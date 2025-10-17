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

interface Exam {
  id: string;
  title: string;
  category: string;
  track: string;
  unit?: string;
  path: string;
}

interface Category {
  id: string;
  name: string;
  tracks?: string[];
}

export default function AssignExamModal({
  isOpen,
  onClose,
  student,
  classId,
  onSuccess,
}: AssignExamModalProps) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categories: Category[] = [
    { id: "GENERAL_ENGLISH", name: "General English", tracks: ["A1", "A2", "B1", "B1+", "B2"] },
    { id: "IELTS", name: "IELTS" },
    { id: "TOEFL", name: "TOEFL" },
    { id: "SAT", name: "SAT" },
    { id: "KIDS", name: "Kids" },
    { id: "MATH", name: "Math" },
  ];

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedCategory("");
      setSelectedTrack("");
      setSelectedExam("");
      fetchAllExams();
    }
  }, [isOpen]);

  const fetchAllExams = async () => {
    setLoadingExams(true);
    try {
      const res = await fetch("/api/exams/json");
      const data = await res.json();
      if (res.ok) {
        setAllExams(data.exams || []);
      } else {
        console.error("Failed to fetch exams:", data.error);
        setAllExams([]);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
      setAllExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTrack("");
    setSelectedExam("");
    
    const category = categories.find(c => c.id === categoryId);
    if (category?.tracks && category.tracks.length > 0) {
      setStep(2); // Go to track selection
    } else {
      setStep(3); // Go directly to exam selection
    }
  };

  const handleTrackSelect = (track: string) => {
    setSelectedTrack(track);
    setSelectedExam("");
    setStep(3);
  };

  const handleExamSelect = (examId: string) => {
    setSelectedExam(examId);
    setStep(4);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setSelectedCategory("");
        setSelectedTrack("");
      } else if (step === 3) {
        const category = categories.find(c => c.id === selectedCategory);
        if (!category?.tracks) {
          setSelectedCategory("");
        }
        setSelectedTrack("");
        setSelectedExam("");
      } else if (step === 4) {
        setSelectedExam("");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedExam) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings/json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          examId: selectedExam,
          sections: ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "WRITING", "SPEAKING"],
          startAt: new Date().toISOString(),
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

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const selectedExamData = allExams.find(e => e.id === selectedExam);
  
  // Filter exams by category and track
  const filteredExams = allExams.filter(exam => {
    if (selectedCategory && exam.category !== selectedCategory) return false;
    if (selectedTrack && exam.track?.toUpperCase() !== selectedTrack) return false;
    return true;
  });

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
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                step >= 1
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              1
            </div>
            <div
              className={`h-1 w-8 ${
                step >= 2 ? "bg-purple-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                step >= 2
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              2
            </div>
            <div
              className={`h-1 w-8 ${
                step >= 3 ? "bg-purple-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                step >= 3
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              3
            </div>
            <div
              className={`h-1 w-8 ${
                step >= 4 ? "bg-purple-600" : "bg-slate-200"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                step >= 4
                  ? "bg-purple-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              4
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>Category</span>
            <span>Track</span>
            <span>Exam</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[300px]">
          {/* Step 1: Select Category */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Select Exam Category
              </h3>
              {loadingExams ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="px-6 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-xl text-purple-700 font-semibold transition-all hover:scale-105 hover:shadow-md"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Track (only for General English) */}
          {step === 2 && selectedCategoryData?.tracks && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Select Level ({selectedCategoryData.name})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedCategoryData.tracks.map((track) => (
                  <button
                    key={track}
                    onClick={() => handleTrackSelect(track)}
                    className="px-6 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-xl text-purple-700 font-semibold transition-all hover:scale-105 hover:shadow-md"
                  >
                    {track}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Exam */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Select Exam
                {selectedCategoryData && <span className="text-sm text-slate-500 ml-2">({selectedCategoryData.name}{selectedTrack && ` - ${selectedTrack}`})</span>}
              </h3>
              {filteredExams.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No exams available for this category</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => handleExamSelect(exam.id)}
                      className="w-full text-left px-4 py-3 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg transition-all hover:shadow-sm flex items-center justify-between group"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-slate-700 group-hover:text-purple-700 block">
                          {exam.title}
                        </span>
                        {exam.unit && (
                          <span className="text-xs text-slate-500">{exam.unit}</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
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
                  <span className="text-xs text-slate-500 uppercase font-medium">Category</span>
                  <p className="text-slate-800 font-medium">{selectedCategoryData?.name}</p>
                </div>
                {selectedTrack && (
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-medium">Level</span>
                    <p className="text-slate-800 font-medium">{selectedTrack}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Exam</span>
                  <p className="text-slate-800 font-medium">
                    {selectedExamData?.title}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-medium">Start Time</span>
                  <p className="text-slate-600 text-sm">
                    Immediately
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

          {step === 4 && (
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

