"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Mail, Loader2, Award, Calendar, BookOpen } from "lucide-react";

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface RosterItem {
  enrollmentId: string;
  student: Student;
  enrolledAt: string;
  latestAttempt: {
    id: string;
    bandOverall: number | null;
    status: string;
    createdAt: string;
  } | null;
}

interface ClassData {
  id: string;
  name: string;
  createdAt: string;
}

interface Exam {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
}

export default function ClassRosterPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  
  // Assign Exam state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignData, setAssignData] = useState({
    examId: "",
    sections: [] as string[],
    startDate: "",
    startTime: "",
  });
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");

  useEffect(() => {
    fetchRoster();
    fetchExams();
  }, [classId]);

  const fetchRoster = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/roster`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/dashboard/teacher/classes");
          return;
        }
        throw new Error("Failed to fetch roster");
      }
      const data = await response.json();
      setClassData(data.class);
      setRoster(data.roster);
    } catch (error) {
      console.error("Error fetching roster:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      const response = await fetch(`/api/classes/${classId}/add-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add student");
      }

      // Refresh roster
      await fetchRoster();
      setStudentEmail("");
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAdding(false);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const data = await response.json();
      setExams(data.exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const openAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setShowAssignModal(true);
    setAssignError("");
    setAssignData({
      examId: "",
      sections: [],
      startDate: "",
      startTime: "",
    });
  };

  const toggleSection = (section: string) => {
    setAssignData(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }));
  };

  const handleAssignExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    setAssigning(true);

    try {
      if (!selectedStudent) throw new Error("No student selected");
      if (!assignData.examId) throw new Error("Please select an exam");
      if (assignData.sections.length === 0) throw new Error("Please select at least one section");
      if (!assignData.startDate || !assignData.startTime) throw new Error("Please select date and time");

      // Combine date and time in Asia/Baku timezone, then convert to UTC
      const bakuDateTime = `${assignData.startDate}T${assignData.startTime}:00`;
      const localDate = new Date(bakuDateTime);
      
      // Convert to UTC ISO string
      const startAtUTC = localDate.toISOString();

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          examId: assignData.examId,
          sections: assignData.sections,
          startAt: startAtUTC,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign exam");
      }

      setShowAssignModal(false);
      setSelectedStudent(null);
      // Show success message or refresh data
      alert(`Exam assigned successfully to ${selectedStudent.name || selectedStudent.email}`);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <p>Class not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/dashboard/teacher/classes")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-gray-600 mt-2">{roster.length} students enrolled</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <UserPlus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      {roster.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No students yet</h3>
          <p className="text-gray-500 mb-6">Add students to this class by their email address</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            <UserPlus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Latest Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Attempt
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {roster.map((item) => (
                  <tr key={item.enrollmentId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {(item.student.name || item.student.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">
                            {item.student.name || "No name"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {item.student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.latestAttempt?.bandOverall ? (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">
                            {item.latestAttempt.bandOverall.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.latestAttempt ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(item.latestAttempt.createdAt).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">No attempts</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openAssignModal(item.student)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        <BookOpen className="w-4 h-4" />
                        Assign Exam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Student</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleAddStudent}>
              <div className="mb-6">
                <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Student Email
                </label>
                <input
                  id="studentEmail"
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
                <p className="text-xs text-gray-500 mt-2">
                  The student must already have an account with the STUDENT role
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setStudentEmail("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !studentEmail.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Exam Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assign Exam</h2>
            <p className="text-gray-600 mb-6">
              Assigning to: <span className="font-semibold">{selectedStudent.name || selectedStudent.email}</span>
            </p>
            
            {assignError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{assignError}</p>
              </div>
            )}
            
            <form onSubmit={handleAssignExam}>
              {/* Exam Selection */}
              <div className="mb-6">
                <label htmlFor="examId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exam
                </label>
                {exams.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>No exams available!</strong>
                    </p>
                    <p className="text-sm text-yellow-700 mb-3">
                      You need to create exam templates first before you can assign them to students.
                    </p>
                    <a
                      href="/dashboard/teacher/exams"
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                    >
                      <BookOpen className="w-4 h-4" />
                      Create Exams
                    </a>
                  </div>
                ) : (
                  <select
                    id="examId"
                    required
                    value={assignData.examId}
                    onChange={(e) => setAssignData({ ...assignData, examId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose an exam...</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Section Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Sections
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["READING", "LISTENING", "WRITING", "SPEAKING"].map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => toggleSection(section)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition ${
                        assignData.sections.includes(section)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    value={assignData.startDate}
                    onChange={(e) => setAssignData({ ...assignData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Time (Asia/Baku)
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    required
                    value={assignData.startTime}
                    onChange={(e) => setAssignData({ ...assignData, startTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                Time will be stored in UTC but displayed in Asia/Baku timezone
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent(null);
                    setAssignError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  disabled={assigning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || exams.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Exam"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

