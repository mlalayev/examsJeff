"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Users, Calendar, Clock } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import { AlertModal } from "@/components/modals/AlertModal";

interface Class {
  id: string;
  name: string;
  studentCount: number;
  students: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  category: string;
  track: string | null;
  totalQuestions: number;
  totalDuration: number;
}

function AssignExamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type?: "success" | "error" | "warning" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    if (!examId) {
      router.push("/dashboard/teacher");
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Load exam details
        const examRes = await fetch(`/api/exams/${examId}`);
        const examJson = await examRes.json();
        if (!examRes.ok) throw new Error(examJson.error || "Failed to load exam");
        setExam(examJson);
        
        // Load teacher's classes
        const classesRes = await fetch("/api/teacher/classes");
        const classesJson = await classesRes.json();
        if (!classesRes.ok) throw new Error(classesJson.error || "Failed to load classes");
        setClasses(classesJson);
        
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load data");
        router.push("/dashboard/teacher");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [examId, router]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const currentClass = classes.find(c => c.id === selectedClass);
    if (!currentClass) return;
    
    if (selectedStudents.length === currentClass.students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(currentClass.students.map(s => s.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass || selectedStudents.length === 0 || !scheduledAt) {
      setAlertModal({ isOpen: true, title: "Validation Error", message: "Please select a class, students, and schedule time", type: "error" });
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          classId: selectedClass,
          studentIds: selectedStudents,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to assign exam");
      
      setAlertModal({
        isOpen: true,
        title: "Success",
        message: `Exam assigned to ${selectedStudents.length} student(s) successfully!`,
        type: "success",
      });
      
      setTimeout(() => {
        router.push("/dashboard/teacher");
      }, 1500);
      
    } catch (e) {
      console.error(e);
      setAlertModal({ isOpen: true, title: "Error", message: e instanceof Error ? e.message : "Failed to assign exam", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UnifiedLoading type="fullpage" variant="spinner" size="lg" fullScreen />
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h2>
          <button
            onClick={() => router.push("/dashboard/teacher")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentClass = classes.find(c => c.id === selectedClass);
  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/catalog")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assign Exam</h1>
        <p className="text-gray-600">Select students and schedule the exam</p>
      </div>

      {/* Exam Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{exam.title}</h2>
        {exam.description && (
          <p className="text-gray-600 mb-4">{exam.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            {exam.totalQuestions} questions
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {exam.totalDuration} minutes
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {exam.category} {exam.track ? `· ${exam.track}` : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Class Selection */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudents([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.studentCount} students)
                </option>
              ))}
            </select>
          </div>

          {/* Student Selection */}
          {currentClass && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Students
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedStudents.length === currentClass.students.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {currentClass.students.map(student => (
                  <label
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                {selectedStudents.length} student(s) selected
              </div>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Students will be able to start the exam at this time
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Assignment Summary</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>Exam: <span className="font-medium">{exam.title}</span></div>
              <div>Class: <span className="font-medium">{currentClass?.name || "Not selected"}</span></div>
              <div>Students: <span className="font-medium">{selectedStudents.length}</span></div>
              <div>Schedule: <span className="font-medium">{scheduledAt ? new Date(scheduledAt).toLocaleString() : "Not set"}</span></div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!selectedClass || selectedStudents.length === 0 || !scheduledAt || submitting}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Assigning..." : `Assign to ${selectedStudents.length} Student(s)`}
          </button>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: "", message: "", type: "info" })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}

export default function AssignExamPage() {
  return (
    <Suspense fallback={<UnifiedLoading type="spinner" variant="spinner" size="md" />}>
      <AssignExamPageContent />
    </Suspense>
  );
}
