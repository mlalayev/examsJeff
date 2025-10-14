"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Mail, Award, Calendar, BookOpen, Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [adding, setAdding] = useState(false);
  
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
      console.error("Error adding student:", err);
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
    setAssignData({
      examId: "",
      sections: [],
      startDate: "",
      startTime: "",
    });
    document.body.style.overflow = 'hidden';
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStudent(null);
    document.body.style.overflow = 'unset';
  };

  const openAddModal = () => {
    setShowAddModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setStudentEmail("");
    document.body.style.overflow = 'unset';
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
        // Show detailed error with conflict info if available
        let errorMsg = data.error || "Failed to assign exam";
        if (data.conflict) {
          const conflictTime = new Date(data.conflict.startAt).toLocaleString('en-US', {
            timeZone: 'Asia/Baku',
            dateStyle: 'short',
            timeStyle: 'short'
          });
          errorMsg += `\n\nConflicting booking:\n- Time: ${conflictTime}\n- Status: ${data.conflict.status}\n\nPlease choose a time at least 30 minutes away from existing bookings.`;
        }
        alert(errorMsg);
        return;
      }

      closeAssignModal();
      alert(`Exam assigned successfully to ${selectedStudent.name || selectedStudent.email}`);
    } catch (err) {
      console.error("Error assigning exam:", err);
      alert(err instanceof Error ? err.message : "Failed to assign exam");
    } finally {
      setAssigning(false);
    }
  };

  const filteredRoster = roster.filter((item) =>
    (item.student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     item.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    total: roster.length,
    withAttempts: roster.filter(item => item.latestAttempt).length,
    averageScore: roster.filter(item => item.latestAttempt?.bandOverall).length > 0 
      ? (roster.filter(item => item.latestAttempt?.bandOverall)
          .reduce((sum, item) => sum + (item.latestAttempt?.bandOverall || 0), 0) / 
         roster.filter(item => item.latestAttempt?.bandOverall).length).toFixed(1)
      : "—"
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-8">
        <p>Class not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/teacher/classes")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Classes
      </button>

      {/* Minimal Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-medium text-gray-900">{classData.name}</h1>
        <p className="text-gray-500 mt-1">Manage students in this class</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Students:</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">With Attempts:</span>
          <span className="font-medium">{stats.withAttempts}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Average Score:</span>
          <span className="font-medium">{stats.averageScore}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <UserPlus className="w-4 h-4 mr-2 inline" />
          Add Student
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {filteredRoster.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Latest Score</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Last Attempt</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Enrolled</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoster.map((item) => (
                  <tr key={item.enrollmentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {(item.student.name || item.student.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.student.name || "No name"}
                          </div>
                          <div className="text-xs text-gray-500">{item.student.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.student.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.latestAttempt?.bandOverall ? (
                        <span className="font-medium text-gray-900">
                          {item.latestAttempt.bandOverall.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.latestAttempt ? (
                        new Date(item.latestAttempt.createdAt).toLocaleDateString()
                      ) : (
                        <span className="text-gray-400">No attempts</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => openAssignModal(item.student)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Assign Exam"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-md border border-gray-200 rounded-md shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Student</h3>
              <p className="text-sm text-gray-500 mt-1">Add a student to this class by email</p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddStudent}>
              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddStudent(e)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    placeholder="student@example.com"
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    The student must already have an account with the STUDENT role
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !studentEmail.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Exam Modal */}
      {showAssignModal && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAssignModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-2xl border border-gray-200 rounded-md shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Assign Exam</h3>
              <p className="text-sm text-gray-500 mt-1">
                Assigning to: <span className="font-medium">{selectedStudent.name || selectedStudent.email}</span>
              </p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAssignExam}>
              <div className="px-6 py-4 space-y-6">
                {/* Exam Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Exam
                  </label>
                  {exams.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>No exams available!</strong>
                      </p>
                      <p className="text-sm text-yellow-700 mb-3">
                        You need to create exam templates first before you can assign them to students.
                      </p>
                      <a
                        href="/dashboard/teacher/exams"
                        target="_blank"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition"
                      >
                        <BookOpen className="w-4 h-4" />
                        Create Exams
                      </a>
                    </div>
                  ) : (
                    <select
                      required
                      value={assignData.examId}
                      onChange={(e) => setAssignData({ ...assignData, examId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Sections
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["READING", "LISTENING", "WRITING", "SPEAKING"].map((section) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => toggleSection(section)}
                        className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                          assignData.sections.includes(section)
                            ? "border-gray-400 bg-gray-100 text-gray-900"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={assignData.startDate}
                      onChange={(e) => setAssignData({ ...assignData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time (Asia/Baku)
                    </label>
                    <input
                      type="time"
                      required
                      value={assignData.startTime}
                      onChange={(e) => setAssignData({ ...assignData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Time will be stored in UTC but displayed in Asia/Baku timezone
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || exams.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  {assigning ? "Assigning..." : "Assign Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

