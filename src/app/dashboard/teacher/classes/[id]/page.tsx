"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Mail, Award, Calendar, BookOpen, Search, UserPlus as UserPlusIcon, X } from "lucide-react";
import AssignExamModal from "@/components/teacher/AssignExamModal";
import { AlertModal } from "@/components/modals/AlertModal";

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: "",
    message: "",
  });
  
  // Assign Exam state (simplified for new modal)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignData, setAssignData] = useState({
    examId: "",
    sections: [] as string[],
    startDate: "",
    startTime: "",
  });

  useEffect(() => {
    // Optimize: fetch both in parallel
    Promise.all([fetchRoster(), fetchUserRole()]);
  }, [classId]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

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
    setEmailError(""); // Clear previous error

    try {
      const response = await fetch(`/api/classes/${classId}/add-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        const errorMessage = data?.error || "Failed to add student";
        const errorLower = errorMessage.toLowerCase();
        
        // Check if user not found (404 status or error message contains "not found")
        if (response.status === 404 || errorLower.includes("not found") || errorLower.includes("student not found")) {
          setEmailError("There is no user with this email. Please double-check the email address.");
          setAdding(false);
          return;
        }
        throw new Error(errorMessage);
      }

      // Refresh roster
      await fetchRoster();
      setStudentEmail("");
      setEmailError("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding student:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add student";
      const errorLower = errorMessage.toLowerCase();
      
      // Check if it's a "not found" error
      if (errorLower.includes("not found") || errorLower.includes("student not found")) {
        setEmailError("There is no user with this email. Please double-check the email address.");
      } else {
        alert(errorMessage);
      }
    } finally {
      setAdding(false);
    }
  };

  const fetchExams = async () => {
    try {
      const [dbRes, jsonRes] = await Promise.all([
        fetch("/api/exams"),
        fetch("/api/exams/json")
      ]);
      
      const dbData = dbRes.ok ? await dbRes.json() : { exams: [] };
      const jsonData = jsonRes.ok ? await jsonRes.json() : { exams: [] };
      
      const allExams = [
        ...dbData.exams.map((e: any) => ({ ...e, source: 'db' })),
        ...jsonData.exams.map((e: any) => ({ ...e, source: 'json' }))
      ];
      
      setExams(allExams);
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
    setEmailError("");
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

  if (!classData && !loading) {
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
        <h1 className="text-2xl font-medium text-gray-900">{classData?.name || "Class"}</h1>
        <p className="text-gray-500 mt-1">
          {classData ? "Manage students in this class" : "Loading class details..."}
        </p>
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
          className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          style={{ backgroundColor: "#303380" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#252a6b";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#303380";
          }}
        >
          <UserPlus className="w-4 h-4 mr-2 inline" />
          Add Student
        </button>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredRoster.length === 0 ? (
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
                        <button
                          onClick={() => router.push(`/attempts/${item.latestAttempt?.id}/results`)}
                          className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          title="View detailed results"
                        >
                          {item.latestAttempt.bandOverall.toFixed(1)}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.latestAttempt ? (
                        <button
                          onClick={() => router.push(`/attempts/${item.latestAttempt?.id}/results`)}
                          className="text-purple-600 hover:text-purple-800 hover:underline"
                          title="View results"
                        >
                          {new Date(item.latestAttempt.createdAt).toLocaleDateString()}
                        </button>
                      ) : (
                        <span className="text-gray-400">No attempts</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/teacher/students/${item.student.id}/attempts`)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          title="View all attempts"
                        >
                          View Attempts
                        </button>
                        {(userRole === "ADMIN" || userRole === "BOSS") && (
                          <button
                            onClick={() => openAssignModal(item.student)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Assign Exam"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAddModal();
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-[#303380] flex items-center justify-center shadow-lg">
                  <UserPlusIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Add Student</h3>
              <p className="text-sm text-gray-600">Add a student to this class by email</p>
            </div>
            
            {/* Modal Content */}
            <form onSubmit={handleAddStudent}>
              <div className="px-6 py-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={studentEmail}
                      onChange={(e) => {
                        setStudentEmail(e.target.value);
                        setEmailError(""); // Clear error when user types
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleAddStudent(e)}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#303380]/20 transition-colors ${
                        emailError 
                          ? "border-red-300 focus:border-red-400 bg-red-50/50" 
                          : "border-gray-200 focus:border-[#303380] bg-gray-50"
                      }`}
                      placeholder="student@example.com"
                      autoFocus
                      required
                    />
                  </div>
                  {emailError ? (
                    <div className="mt-2 flex items-start gap-2">
                      <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 leading-relaxed">
                        {emailError}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      The student must already have an account with the <strong>STUDENT</strong> role
                    </p>
                  )}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !studentEmail.trim()}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-[#303380] border border-transparent rounded-lg hover:bg-[#252a6b] focus:outline-none focus:ring-2 focus:ring-[#303380]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  {adding ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    "Add Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Exam Modal - New 3-Step Flow */}
      <AssignExamModal
        isOpen={showAssignModal && !!selectedStudent}
        onClose={closeAssignModal}
        student={selectedStudent!}
        classId={classId}
        onSuccess={() => {
          fetchRoster();
          setSuccessModal({
            isOpen: true,
            title: "Success",
            message: "Exam assigned successfully!",
          });
        }}
      />

      {/* Success Modal */}
      <AlertModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, title: "", message: "" })}
        title={successModal.title}
        message={successModal.message}
        type="success"
      />
    </div>
  );
}

