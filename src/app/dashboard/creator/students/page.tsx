"use client";

import { useEffect, useState } from "react";
import { Users, Search, BookOpen, X, ChevronRight, ChevronLeft, Target, FileText, CheckCircle } from "lucide-react";
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
    if (assignStep <= 1) return;
    if (assignStep === 2) {
      setSelectedCategory("");
      setSelectedTrack("");
      setAssignStep(1);
    } else if (assignStep === 3) {
      const category = categories.find(c => c.id === selectedCategory);
      setSelectedTrack("");
      setSelectedExamId("");
      if (category?.tracks && category.tracks.length > 0) {
        setAssignStep(2);
      } else {
        setSelectedCategory("");
        setAssignStep(1);
      }
    } else if (assignStep === 4) {
      setSelectedExamId("");
      setAssignStep(3);
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

      {/* Assign Exam Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#303380]/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-[#303380]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Assign Exam</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedStudent.name || selectedStudent.email}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAssignModal}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress - stepper line */}
            <div className="px-6 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-gray-500">
                {/* Step 1: Category */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                      assignStep >= 1 ? 'bg-[#303380] border-[#303380] text-white' : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {assignStep > 1 ? '✓' : '1'}
                  </div>
                  <span className="mt-1">Category</span>
                </div>

                {/* Connector 1 */}
                <div
                  className={`h-px flex-1 ${
                    assignStep >= (selectedCategoryData?.tracks ? 2 : 3) ? 'bg-[#303380]' : 'bg-gray-200'
                  }`}
                />

                {/* Step 2: Level (only if tracks exist) */}
                {selectedCategoryData?.tracks && (
                  <>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                          assignStep >= 2 ? 'bg-[#303380] border-[#303380] text-white' : 'border-gray-300 text-gray-500'
                        }`}
                      >
                        {assignStep > 2 ? '✓' : '2'}
                      </div>
                      <span className="mt-1">Level</span>
                    </div>
                    <div
                      className={`h-px flex-1 ${assignStep >= 3 ? 'bg-[#303380]' : 'bg-gray-200'}`}
                    />
                  </>
                )}

                {/* Step 3: Exam */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                      assignStep >= 3 ? 'bg-[#303380] border-[#303380] text-white' : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {assignStep > 3 ? '✓' : selectedCategoryData?.tracks ? '3' : '2'}
                  </div>
                  <span className="mt-1">Exam</span>
                </div>

                {/* Connector 3 */}
                <div
                  className={`h-px flex-1 ${assignStep >= 4 ? 'bg-[#303380]' : 'bg-gray-200'}`}
                />

                {/* Step 4: Confirm */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] ${
                      assignStep >= 4 ? 'bg-[#303380] border-[#303380] text-white' : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {selectedCategoryData?.tracks ? '4' : '3'}
                  </div>
                  <span className="mt-1">Confirm</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 min-h-[320px] overflow-y-auto flex-1">
              {assignStep === 1 && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">Select exam category</h3>
                  <p className="text-sm text-gray-500 mb-5">Choose the type of exam you want to assign</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#303380]/40 hover:bg-[#303380]/5 transition text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-[#303380]/10 flex items-center justify-center flex-shrink-0 transition">
                            <BookOpen className="w-5 h-5 text-gray-600 group-hover:text-[#303380]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900">{category.name}</h4>
                            {category.tracks && (
                              <p className="text-xs text-gray-500 mt-0.5">{category.tracks.length} levels</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#303380] flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {assignStep === 2 && selectedCategoryData?.tracks && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">Select difficulty level</h3>
                  <p className="text-sm text-gray-500 mb-5">{selectedCategoryData.name} — choose the level</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {selectedCategoryData.tracks.map((track, index) => (
                      <button
                        key={track}
                        onClick={() => handleTrackSelect(track)}
                        className="p-3 rounded-xl border border-gray-200 bg-white hover:border-[#303380]/40 hover:bg-[#303380]/5 transition text-center font-medium text-sm text-gray-900"
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {assignStep === 3 && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">Select exam</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    {selectedCategoryData?.name}
                    {selectedTrack && ` • ${selectedTrack}`}
                  </p>
                  {filteredExams.length === 0 ? (
                    <div className="text-center py-16 rounded-xl bg-gray-50">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm">No exams available for this category</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredExams.map((exam) => (
                        <button
                          key={exam.id}
                          onClick={() => handleExamSelect(exam.id)}
                          className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-[#303380]/40 hover:bg-[#303380]/5 transition group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-[#303380]/10 flex items-center justify-center flex-shrink-0 transition">
                                <FileText className="w-4 h-4 text-gray-600 group-hover:text-[#303380]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate">{exam.title}</h4>
                                {exam.track && <p className="text-xs text-gray-500 mt-0.5">Level: {exam.track}</p>}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#303380] flex-shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {assignStep === 4 && (
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">Confirm assignment</h3>
                  <p className="text-sm text-gray-500 mb-5">Review before assigning</p>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student</p>
                        <p className="text-sm font-medium text-gray-900">{selectedStudent.name || selectedStudent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Exam</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedExamData?.title}</p>
                        {selectedExamData?.track && (
                          <p className="text-xs text-gray-500 mt-0.5">{selectedCategoryData?.name} • {selectedExamData.track}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={assignStep === 1 ? closeAssignModal : handleBack}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                disabled={assigning}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleAssignExam}
                disabled={assignStep !== 4 || assigning || !selectedExamId}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: "#303380" }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#252a6b";
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#303380";
                }}
              >
                {assigning ? (
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
            </div>
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
