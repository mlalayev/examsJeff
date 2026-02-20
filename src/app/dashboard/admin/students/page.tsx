"use client";

import { useEffect, useState } from "react";
import { Users, Search, BookOpen, X, Calendar, ChevronRight, ChevronLeft, Target, FileText, CheckCircle, UserPlus } from "lucide-react";
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

export default function AdminStudentsPage() {
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as string,
    branchId: "",
    approved: true,
    phoneNumber: "",
    dateOfBirth: "",
    program: "",
    paymentDate: "",
    paymentAmount: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    // Optimize: fetch both in parallel
    Promise.all([fetchStudents(), fetchExams()]);
    // Fetch branches for create user modal
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch(console.error);
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
          alert("Student approved! They should logout and login again to access their dashboard.");
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

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
      branchId: "",
      approved: true,
      phoneNumber: "",
      dateOfBirth: "",
      program: "",
      paymentDate: "",
      paymentAmount: "",
    });
    setCreateError("");
    setShowCreateModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateError("");
    document.body.style.overflow = 'unset';
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!formData.name || !formData.email || !formData.password) {
      setCreateError("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      setCreateError("Password must be at least 6 characters");
      return;
    }

    // Validate student-specific fields
    if (formData.role === "STUDENT") {
      if (!formData.phoneNumber || !formData.dateOfBirth || !formData.program) {
        setCreateError("Phone number, date of birth, and program are required for students");
        return;
      }
      if (!formData.branchId) {
        setCreateError("Branch is required for students");
        return;
      }
    }

    setCreating(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        branchId: formData.branchId || null,
        approved: formData.approved,
      };

      // Add student-specific fields if role is STUDENT
      if (formData.role === "STUDENT") {
        payload.studentProfile = {
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          program: formData.program,
          paymentDate: formData.paymentDate || null,
          paymentAmount: formData.paymentAmount || null,
        };
      }

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setAlertModal({
          isOpen: true,
          title: "Success",
          message: `User created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nPlease save these credentials.`,
          type: "success",
        });
        closeCreateModal();
        await fetchStudents();
      } else {
        setCreateError(data.error || "Failed to create user");
      }
    } catch (error) {
      setCreateError("An error occurred while creating user");
    } finally {
      setCreating(false);
    }
  };

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
          <button
            onClick={openCreateModal}
            className="px-3 py-2 text-sm font-medium text-white rounded-md border transition flex items-center gap-2"
            style={{ backgroundColor: "#303380", borderColor: "#303380" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#252a6b";
              e.currentTarget.style.borderColor = "#252a6b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#303380";
              e.currentTarget.style.borderColor = "#303380";
            }}
          >
            <UserPlus className="w-4 h-4" />
            Create User
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-gray-900">Assign Exam</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {selectedStudent.name || selectedStudent.email}
                </p>
              </div>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600 rounded-md p-1.5 hover:bg-gray-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between overflow-x-auto">
                {/* Step 1: Category */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs sm:text-sm font-medium transition ${
                    assignStep >= 1 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {assignStep > 1 ? '✓' : '1'}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-medium ${assignStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Category
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition ${
                  (selectedCategoryData?.tracks && assignStep >= 2) || (!selectedCategoryData?.tracks && assignStep >= 3) ? 'bg-gray-900' : 'bg-gray-200'
                }`}></div>

                {/* Step 2: Track (only if tracks exist) */}
                {selectedCategoryData?.tracks && (
                  <>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs sm:text-sm font-medium transition ${
                        assignStep >= 2 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {assignStep > 2 ? '✓' : '2'}
                      </div>
                      <div className="hidden sm:block">
                        <p className={`text-xs font-medium ${assignStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                          Level
                        </p>
                      </div>
                    </div>
                    <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition ${
                      assignStep >= 3 ? 'bg-gray-900' : 'bg-gray-200'
                    }`}></div>
                  </>
                )}

                {/* Step 3: Exam (shown as step 2 if no tracks, step 3 if tracks exist) */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs sm:text-sm font-medium transition ${
                    assignStep >= 3 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {assignStep > 3 ? '✓' : selectedCategoryData?.tracks ? '3' : '2'}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-medium ${assignStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Exam
                    </p>
                  </div>
                </div>

                <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition ${
                  assignStep >= 4 ? 'bg-gray-900' : 'bg-gray-200'
                }`}></div>

                {/* Step 4: Confirm (shown as step 3 if no tracks, step 4 if tracks exist) */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs sm:text-sm font-medium transition ${
                    assignStep >= 4 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {selectedCategoryData?.tracks ? '4' : '3'}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-medium ${assignStep >= 4 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Confirm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 min-h-[300px] overflow-y-auto flex-1">
              {/* Step 1: Select Category */}
              {assignStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
                      Select Exam Category
                    </h3>
                    <p className="text-sm text-gray-500">Choose the type of exam you want to assign</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className="p-4 rounded-md border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900">
                              {category.name}
                            </h4>
                            {category.tracks && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {category.tracks.length} levels available
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Track (only for General English) */}
              {assignStep === 2 && selectedCategoryData?.tracks && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
                      Select Difficulty Level
                    </h3>
                    <p className="text-sm text-gray-500">Choose the appropriate level for {selectedCategoryData.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {selectedCategoryData.tracks.map((track, index) => (
                      <button
                        key={track}
                        onClick={() => handleTrackSelect(track)}
                        className="p-4 rounded-md border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition text-center"
                      >
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mx-auto mb-2">
                          <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-sm text-gray-900">
                          {track}
                        </h4>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Select Exam */}
              {assignStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
                      Select Specific Exam
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedCategoryData?.name}
                      {selectedTrack && ` • ${selectedTrack} Level`}
                    </p>
                  </div>
                  
                  {filteredExams.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 text-sm">No exams available for this category</p>
                      <p className="text-gray-400 text-xs mt-1">Try selecting a different category or level</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredExams.map((exam) => (
                        <button
                          key={exam.id}
                          onClick={() => handleExamSelect(exam.id)}
                          className="w-full text-left p-3 rounded-md border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-gray-700" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate">
                                  {exam.title}
                                </h4>
                                {exam.track && (
                                  <p className="text-xs text-gray-500 mt-0.5">Level: {exam.track}</p>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Confirm */}
              {assignStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
                      Confirm Assignment
                    </h3>
                    <p className="text-sm text-gray-500">Review the details before assigning the exam</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4 sm:p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-gray-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Student</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedStudent.name || selectedStudent.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-gray-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Category</p>
                            <p className="text-sm font-medium text-gray-900">{selectedCategoryData?.name}</p>
                          </div>
                        </div>
                        
                        {selectedTrack && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Target className="w-4 h-4 text-gray-700" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Level</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTrack}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500">Exam</p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedExamData?.title}
                            </p>
                            {selectedExamData?.track && (
                              <p className="text-xs text-gray-500 mt-0.5">Level: {selectedExamData.track}</p>
                            )}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={assignStep === 1 ? closeAssignModal : handleBack}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 transition hover:bg-gray-100 rounded-md text-sm"
                  disabled={assigning}
                >
                  {assignStep === 1 ? (
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

                {assignStep < 4 && (
                  <button
                    onClick={() => {
                      if (assignStep === 3 && selectedExamId) {
                        setAssignStep(4);
                      }
                    }}
                    disabled={assignStep === 3 && !selectedExamId}
                    className="px-4 py-2 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    style={{ backgroundColor: "#303380" }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = "#252a6b";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = "#303380";
                      }
                    }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {assignStep === 4 && (
                  <button
                    onClick={handleAssignExam}
                    disabled={assigning}
                    className="px-4 py-2 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    style={{ backgroundColor: "#303380" }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = "#252a6b";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = "#303380";
                      }
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-gray-900">Create New User</h2>
                <p className="text-gray-500 text-sm mt-0.5">Manually create a user account</p>
              </div>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600 rounded-md p-1.5 hover:bg-gray-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6 overflow-y-auto flex-1">
              {createError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{createError}</p>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure to save this password! You can reset it later if needed.
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch {formData.role === "STUDENT" && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    required={formData.role === "STUDENT"}
                  >
                    <option value="">No Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.role === "STUDENT" ? "Required for students" : "Optional - assign user to a branch"}
                  </p>
                </div>

                {/* Student-specific fields */}
                {formData.role === "STUDENT" && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-4">Student Information</h3>

                      {/* Phone Number */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="+994 XX XXX XX XX"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>

                      {/* Program */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.program}
                          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="e.g., General English A2, IELTS Preparation"
                        />
                      </div>

                      {/* Payment Date */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>

                      {/* Payment Amount */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Amount (Optional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.paymentAmount}
                          onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Payment amount in AZN</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Approved */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="approved"
                    checked={formData.approved}
                    onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                  <label htmlFor="approved" className="text-sm font-medium text-gray-700">
                    Approve user immediately (recommended for manually created accounts)
                  </label>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition hover:bg-gray-100 rounded-md text-sm"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={creating}
                  className="px-4 py-2 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ backgroundColor: "#303380" }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#252a6b";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#303380";
                    }
                  }}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 inline-block mr-2" />
                      Create User
                    </>
                  )}
                </button>
              </div>
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
