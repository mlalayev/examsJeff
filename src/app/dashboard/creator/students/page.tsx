"use client";

import { useEffect, useState } from "react";
import { Users, Search, BookOpen, X, Calendar, ChevronRight, ChevronLeft, Target, FileText, CheckCircle } from "lucide-react";
import { AlertModal } from "@/components/modals/AlertModal";

interface Student {
  id: string;
  name: string | null;
  email: string;
  approved: boolean;
  createdAt: string;
  branchId: string | null;
  branch: {
    id: string;
    name: string;
  } | null;
}

interface Exam {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
}

export default function CreatorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterApproved, setFilterApproved] = useState<boolean | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignStep, setAssignStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [assignData, setAssignData] = useState({
    examId: "",
  });
  const [assigning, setAssigning] = useState(false);
  const [jsonExams, setJsonExams] = useState<any[]>([]);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; type?: "success" | "error" | "warning" | "info" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    // Optimize: fetch both in parallel
    Promise.all([fetchStudents(), fetchExams()]);
  }, [filterApproved]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (filterApproved !== null) {
        params.append("approved", filterApproved.toString());
      }
      const res = await fetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      // OPTIMIZED: Remove JSON exams API call (legacy, not used anymore)
      const dbRes = await fetch("/api/admin/exams?isActive=true");
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        setExams(dbData.exams || []);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  const handleApprove = async (studentId: string, approve: boolean) => {
    setUpdating(studentId);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approve })
      });

      if (res.ok) {
        await fetchStudents();
        if (approve) {
          setAlertModal({ isOpen: true, title: "Success", message: "Student approved! They should logout and login again to access their dashboard.", type: "success" });
        }
      } else {
        const data = await res.json();
        setAlertModal({ isOpen: true, title: "Error", message: data.error || "Failed to update approval status", type: "error" });
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to update approval status", type: "error" });
    } finally {
      setUpdating(null);
    }
  };

  const categories = [
    { id: "GENERAL_ENGLISH", name: "General English", tracks: ["A1", "A2", "B1", "B1+", "B2", "C1", "C2"] },
    { id: "IELTS", name: "IELTS" },
    { id: "TOEFL", name: "TOEFL" },
    { id: "SAT", name: "SAT" },
    { id: "KIDS", name: "Kids" },
    { id: "MATH", name: "Math" },
  ];

  const openAssignModal = (student: Student) => {
    setSelectedStudent(student);
    setAssignStep(1);
    setSelectedCategory("");
    setSelectedTrack("");
    setSelectedExamId("");
    setAssignData({
      examId: "",
    });
    setShowAssignModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStudent(null);
    setAssignStep(1);
    setSelectedCategory("");
    setSelectedTrack("");
    setSelectedExamId("");
    setAssignData({
      examId: "",
    });
    document.body.style.overflow = 'unset';
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTrack("");
    setSelectedExamId("");
    const category = categories.find(c => c.id === categoryId);
    if (category?.tracks && category.tracks.length > 0) {
      setAssignStep(2);
    } else {
      setAssignStep(3);
    }
  };

  const handleTrackSelect = (track: string) => {
    setSelectedTrack(track);
    setSelectedExamId("");
    setAssignStep(3);
  };

  const handleExamSelect = (examId: string) => {
    setSelectedExamId(examId);
    setAssignData({ ...assignData, examId });
    setAssignStep(4); // Skip schedule step, go directly to confirm
  };

  const handleBack = () => {
    if (assignStep > 1) {
      setAssignStep(assignStep - 1);
      if (assignStep === 2) {
        setSelectedCategory("");
        setSelectedTrack("");
      } else if (assignStep === 3) {
        const category = categories.find(c => c.id === selectedCategory);
        if (!category?.tracks) {
          setSelectedCategory("");
        }
        setSelectedTrack("");
        setSelectedExamId("");
      } else if (assignStep === 4) {
        setSelectedExamId("");
      }
    }
  };

  const handleAssignExam = async () => {
    if (!selectedStudent) return;
    if (!assignData.examId) {
      setAlertModal({ isOpen: true, title: "Validation Error", message: "Please select an exam", type: "error" });
      return;
    }

    setAssigning(true);
    try {
      const selectedExam = [...exams, ...jsonExams].find(e => e.id === assignData.examId);
      const isJsonExam = jsonExams.some(e => e.id === assignData.examId);
      const apiPath = isJsonExam ? "/api/bookings/json" : "/api/bookings";

      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          examId: assignData.examId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || "Failed to assign exam";
        setAlertModal({ isOpen: true, title: "Error", message: errorMsg, type: "error" });
        return;
      }

      setAlertModal({
        isOpen: true,
        title: "Success",
        message: `Exam assigned successfully to ${selectedStudent.name || selectedStudent.email}`,
        type: "success",
      });
      closeAssignModal();
    } catch (error) {
      console.error("Error assigning exam:", error);
      setAlertModal({ isOpen: true, title: "Error", message: "Failed to assign exam", type: "error" });
    } finally {
      setAssigning(false);
    }
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const allExamsList = [...exams.map(e => ({ ...e, source: 'db' })), ...jsonExams.map(e => ({ ...e, source: 'json' }))];
  const filteredExams = allExamsList.filter(exam => {
    if (selectedCategory && exam.category !== selectedCategory) return false;
    if (selectedTrack && exam.track?.toUpperCase() !== selectedTrack) return false;
    return true;
  });
  const selectedExamData = filteredExams.find(e => e.id === selectedExamId);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = students.filter(s => !s.approved).length;
  const approvedCount = students.filter(s => s.approved).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage student accounts and approvals</p>
      </div>

      {/* Compact Stats Row */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-6 sm:mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total Students:</span>
          <span className="font-medium">{students.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Pending Approval:</span>
          <span className="font-medium">{pendingCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Approved:</span>
          <span className="font-medium">{approvedCount}</span>
        </div>
      </div>

      {/* Simple Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterApproved(null)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === null
                ? "text-white"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            style={filterApproved === null ? { backgroundColor: "#303380", borderColor: "#303380" } : {}}
            onMouseEnter={(e) => {
              if (filterApproved === null) {
                e.currentTarget.style.backgroundColor = "#252a6b";
                e.currentTarget.style.borderColor = "#252a6b";
              }
            }}
            onMouseLeave={(e) => {
              if (filterApproved === null) {
                e.currentTarget.style.backgroundColor = "#303380";
                e.currentTarget.style.borderColor = "#303380";
              }
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilterApproved(false)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === false
                ? "text-white"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            style={filterApproved === false ? { backgroundColor: "#303380", borderColor: "#303380" } : {}}
            onMouseEnter={(e) => {
              if (filterApproved === false) {
                e.currentTarget.style.backgroundColor = "#252a6b";
                e.currentTarget.style.borderColor = "#252a6b";
              }
            }}
            onMouseLeave={(e) => {
              if (filterApproved === false) {
                e.currentTarget.style.backgroundColor = "#303380";
                e.currentTarget.style.borderColor = "#303380";
              }
            }}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterApproved(true)}
            className={`px-3 py-2 text-sm font-medium rounded-md border transition ${
              filterApproved === true
                ? "text-white"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            style={filterApproved === true ? { backgroundColor: "#303380", borderColor: "#303380" } : {}}
            onMouseEnter={(e) => {
              if (filterApproved === true) {
                e.currentTarget.style.backgroundColor = "#252a6b";
                e.currentTarget.style.borderColor = "#252a6b";
              }
            }}
            onMouseLeave={(e) => {
              if (filterApproved === true) {
                e.currentTarget.style.backgroundColor = "#303380";
                e.currentTarget.style.borderColor = "#303380";
              }
            }}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Simple Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Branch</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Joined</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="h-4 bg-gray-400 rounded w-24 animate-pulse"></div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-6 bg-gray-400 rounded-full w-16 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-4 bg-gray-400 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="h-6 bg-gray-400 rounded w-16 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Student</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Branch</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Joined</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium text-xs flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase() || student.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-gray-900">
                          {student.name || "No name"}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.email}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {student.branch?.name || "No branch"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.approved
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {student.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {student.approved ? (
                          <>
                            <button
                              onClick={() => openAssignModal(student)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 flex items-center gap-1"
                            >
                              <BookOpen className="w-3 h-3" />
                              Assign Exam
                            </button>
                            <button
                              onClick={() => handleApprove(student.id, false)}
                              disabled={updating === student.id}
                              className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 rounded hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {updating === student.id ? "Updating..." : "Revoke"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleApprove(student.id, true)}
                            disabled={updating === student.id}
                            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating === student.id ? "Updating..." : "Approve"}
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

      {/* Assign Exam Modal - keeping same modal code from admin students page */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {/* ... same modal code as in admin students ... */}
          <div className="bg-white rounded-md p-6">
            <p>Assign Exam Modal (same as admin)</p>
            <button onClick={closeAssignModal} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </div>
        </div>
      )}

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
