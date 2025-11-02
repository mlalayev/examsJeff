"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, BookOpen, Target, FileText, CheckCircle, Users, Clock, Calendar } from "lucide-react";

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
      <div className="rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
           style={{
             backgroundColor: 'rgba(48, 51, 128, 0.01)',
             borderColor: 'rgba(48, 51, 128, 0.1)',
             border: '1px solid'
           }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between"
             style={{ backgroundColor: '#303380' }}>
          <div>
            <h2 className="text-xl font-bold text-white">Assign Exam</h2>
            <p className="text-white/80 text-sm mt-1">
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

        {/* Modern Progress Steps */}
        <div className="px-4 sm:px-6 py-6 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200">
          <div className="flex items-center justify-between overflow-x-auto">
            {/* Step 1: Category */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
              <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                step >= 1 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200' 
                  : 'bg-slate-200'
              }`}>
                {step > 1 ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs sm:text-sm font-semibold ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>1</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${step >= 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Category
                </p>
                <p className="text-xs text-slate-500">Choose exam type</p>
              </div>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${
              step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'
            }`}></div>

            {/* Step 2: Track */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
              <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                step >= 2 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200' 
                  : 'bg-slate-200'
              }`}>
                {step > 2 ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs sm:text-sm font-semibold ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>2</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${step >= 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Level
                </p>
                <p className="text-xs text-slate-500">Select difficulty</p>
              </div>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${
              step >= 3 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'
            }`}></div>

            {/* Step 3: Exam */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
              <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                step >= 3 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200' 
                  : 'bg-slate-200'
              }`}>
                {step > 3 ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs sm:text-sm font-semibold ${step >= 3 ? 'text-white' : 'text-slate-500'}`}>3</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${step >= 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Exam
                </p>
                <p className="text-xs text-slate-500">Pick specific test</p>
              </div>
            </div>

            {/* Connector Line */}
            <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${
              step >= 4 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'
            }`}></div>

            {/* Step 4: Confirm */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
              <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                step >= 4 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-200' 
                  : 'bg-slate-200'
              }`}>
                {step > 4 ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-xs sm:text-sm font-semibold ${step >= 4 ? 'text-white' : 'text-slate-500'}`}>4</span>
                )}
              </div>
              <div className="hidden sm:block">
                <p className={`text-sm font-medium ${step >= 4 ? 'text-slate-900' : 'text-slate-500'}`}>
                  Confirm
                </p>
                <p className="text-xs text-slate-500">Review & assign</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6 min-h-[300px]">
          {/* Step 1: Select Category */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Select Exam Category
                </h3>
                <p className="text-slate-600">Choose the type of exam you want to assign</p>
              </div>
              
              {loadingExams ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="group relative p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-3 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {category.name}
                        </h4>
                        {category.tracks && (
                          <p className="text-xs text-slate-500 mt-1">
                            {category.tracks.length} levels available
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Track (only for General English) */}
          {step === 2 && selectedCategoryData?.tracks && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Select Difficulty Level
                </h3>
                <p className="text-slate-600">Choose the appropriate level for {selectedCategoryData.name}</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {selectedCategoryData.tracks.map((track, index) => (
                  <button
                    key={track}
                    onClick={() => handleTrackSelect(track)}
                    className="group relative p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-2 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                        <span className="text-sm font-bold text-green-600">{index + 1}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-green-700 transition-colors text-sm">
                        {track}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Exam */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Select Specific Exam
                </h3>
                <p className="text-slate-600">
                  {selectedCategoryData?.name}
                  {selectedTrack && ` • ${selectedTrack} Level`}
                </p>
              </div>
              
              {filteredExams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">No exams available for this category</p>
                  <p className="text-slate-400 text-sm mt-1">Try selecting a different category or level</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredExams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => handleExamSelect(exam.id)}
                      className="w-full text-left p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg group-hover:from-purple-100 group-hover:to-violet-100 transition-colors">
                              <FileText className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                                {exam.title}
                              </h4>
                              {exam.unit && (
                                <p className="text-sm text-slate-500">Unit: {exam.unit}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Confirm Assignment
                </h3>
                <p className="text-slate-600">Review the details before assigning the exam</p>
              </div>
              
              <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl p-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Student</p>
                        <p className="font-semibold text-slate-900">
                          {student.name || student.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Category</p>
                        <p className="font-semibold text-slate-900">{selectedCategoryData?.name}</p>
                      </div>
                    </div>
                    
                    {selectedTrack && (
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Level</p>
                          <p className="font-semibold text-slate-900">{selectedTrack}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Exam</p>
                        <p className="font-semibold text-slate-900">
                          {selectedExamData?.title}
                        </p>
                        {selectedExamData?.unit && (
                          <p className="text-sm text-slate-500">Unit: {selectedExamData.unit}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Start Time</p>
                        <p className="font-semibold text-slate-900">Immediately</p>
                        <p className="text-sm text-slate-500">Student can start right away</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
          <div className="flex items-center justify-between">
            <button
              onClick={step === 1 ? onClose : handleBack}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium flex items-center gap-2 transition-all hover:bg-slate-100 rounded-lg"
              disabled={submitting}
            >
              {step === 1 ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel
                </>
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
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Assign Exam
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

