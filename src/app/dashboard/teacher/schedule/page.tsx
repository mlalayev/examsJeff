"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Trash2, Clock, BookOpen, AlertCircle, Pencil, Users, DollarSign, X } from "lucide-react";
import { useSession } from "next-auth/react";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

type Lesson = {
  id: string;
  className: string;
  timeSlot: string;
  students: Student[];
  hourlyRate: number;
};

type Schedule = {
  oddDays: Lesson[];
  evenDays: Lesson[];
};

const TIME_SLOTS = [
  "07:00 - 08:00",
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
];

export default function TeacherSchedulePage() {
  useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"odd" | "even">("odd");
  const [schedule, setSchedule] = useState<Schedule>({
    oddDays: [],
    evenDays: [],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [alert, setAlert] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const autoSaveSchedule = useCallback(async (newSchedule: Schedule) => {
    try {
      await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: newSchedule }),
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/schedule");
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          setSchedule(data.schedule);
        }
      }
    } catch (error) {
      console.error("Failed to load schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 2000);
  };

  const addLesson = (lesson: Omit<Lesson, "id">) => {
    const newLesson = {
      ...lesson,
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const newSchedule = {
      ...schedule,
      [activeTab === "odd" ? "oddDays" : "evenDays"]: [
        ...schedule[activeTab === "odd" ? "oddDays" : "evenDays"],
        newLesson,
      ],
    };

    setSchedule(newSchedule);
    autoSaveSchedule(newSchedule);
    setShowAddModal(false);
    setEditingLesson(null);
    showAlert("Lesson added", "success");
  };

  const updateLesson = (lessonId: string, updatedLesson: Omit<Lesson, "id">) => {
    const dayType = activeTab === "odd" ? "oddDays" : "evenDays";
    const newSchedule = {
      ...schedule,
      [dayType]: schedule[dayType].map((lesson) =>
        lesson.id === lessonId ? { ...updatedLesson, id: lessonId } : lesson
      ),
    };
    
    setSchedule(newSchedule);
    autoSaveSchedule(newSchedule);
    setShowAddModal(false);
    setEditingLesson(null);
    showAlert("Lesson updated", "success");
  };

  const deleteLesson = (lessonId: string) => {
    const dayType = activeTab === "odd" ? "oddDays" : "evenDays";
    const newSchedule = {
      ...schedule,
      [dayType]: schedule[dayType].filter((lesson) => lesson.id !== lessonId),
    };
    
    setSchedule(newSchedule);
    autoSaveSchedule(newSchedule);
    showAlert("Lesson deleted", "success");
  };

  const sortedLessons = (lessons: Lesson[]) => {
    return [...lessons].sort((a, b) => {
      const aTime = a.timeSlot.split(" - ")[0];
      const bTime = b.timeSlot.split(" - ")[0];
      return aTime.localeCompare(bTime);
    });
  };

  const calculateTotalEarnings = (dayType: "odd" | "even") => {
    const lessons = schedule[dayType === "odd" ? "oddDays" : "evenDays"];
    return lessons.reduce((total, lesson) => total + lesson.hourlyRate, 0);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-300 rounded-lg"></div>
            <div className="h-96 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Schedule</h1>
        </div>
        <p className="text-gray-600">Manage your classes for odd and even days</p>
      </div>

      {/* Alert */}
      {alert.show && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            alert.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          <span>{alert.message}</span>
        </div>
      )}

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-purple-700" />
            <h3 className="text-lg font-semibold text-purple-900">Odd Days Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">${calculateTotalEarnings("odd").toFixed(2)}</p>
          <p className="text-sm text-purple-600 mt-1">{schedule.oddDays.length} classes</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-blue-700" />
            <h3 className="text-lg font-semibold text-blue-900">Even Days Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">${calculateTotalEarnings("even").toFixed(2)}</p>
          <p className="text-sm text-blue-600 mt-1">{schedule.evenDays.length} classes</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("odd")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === "odd"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Odd Days</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {schedule.oddDays.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("even")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === "even"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Even Days</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {schedule.evenDays.length}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Class to {activeTab === "odd" ? "Odd" : "Even"} Days
        </button>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No classes scheduled for {activeTab === "odd" ? "odd" : "even"} days
            </h3>
            <p className="text-gray-600 mb-4">
              Click "Add Class" to create your first class for {activeTab === "odd" ? "odd" : "even"} days
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).map((lesson) => (
              <div
                key={lesson.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{lesson.className}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.timeSlot}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{lesson.students.length} students</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">${lesson.hourlyRate.toFixed(2)}/hr</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setShowAddModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit class"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete class"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Students List */}
                {lesson.students.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Students:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lesson.students.map((student) => (
                        <span
                          key={student.id}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {student.firstName} {student.lastName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowAddModal(false);
            setEditingLesson(null);
          }}
          onSave={(lesson) => {
            if (editingLesson) {
              updateLesson(editingLesson.id, lesson);
            } else {
              addLesson(lesson);
            }
          }}
          dayType={activeTab}
        />
      )}
    </div>
  );
}

function LessonModal({
  lesson,
  onClose,
  onSave,
  dayType,
}: {
  lesson: Lesson | null;
  onClose: () => void;
  onSave: (lesson: Omit<Lesson, "id">) => void;
  dayType: "odd" | "even";
}) {
  const [className, setClassName] = useState(lesson?.className || "");
  const [timeSlot, setTimeSlot] = useState(lesson?.timeSlot || "");
  const [hourlyRate, setHourlyRate] = useState(lesson?.hourlyRate.toString() || "");
  const [students, setStudents] = useState<Student[]>(lesson?.students || []);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const addStudent = () => {
    if (!firstName.trim() || !lastName.trim()) return;

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    setStudents([...students, newStudent]);
    setFirstName("");
    setLastName("");
    setShowStudentForm(false);
  };

  const removeStudent = (studentId: string) => {
    setStudents(students.filter((s) => s.id !== studentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className || !timeSlot || !hourlyRate) return;

    onSave({
      className,
      timeSlot,
      hourlyRate: parseFloat(hourlyRate),
      students,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {lesson ? "Edit Class" : `Add Class to ${dayType === "odd" ? "Odd" : "Even"} Days`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Mathematics 10A, English Beginners"
              required
            />
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Slot (1 hour) *
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Select a time slot</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 50.00"
              required
            />
          </div>

          {/* Students Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Students ({students.length})
              </label>
              <button
                type="button"
                onClick={() => setShowStudentForm(!showStudentForm)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            {/* Add Student Form */}
            {showStudentForm && (
              <div className="bg-purple-50 p-4 rounded-lg mb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addStudent}
                    disabled={!firstName.trim() || !lastName.trim()}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentForm(false);
                      setFirstName("");
                      setLastName("");
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Students List */}
            {students.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStudent(student.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No students added yet</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {lesson ? "Update Class" : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




