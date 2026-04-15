"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, AlertCircle, Pencil, Users, DollarSign, X, ChevronLeft, ChevronRight } from "lucide-react";
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

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function TeacherSchedulePage() {
  useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"odd" | "even">("odd");
  const [schedule, setSchedule] = useState<Schedule>({
    oddDays: [],
    evenDays: [],
  });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showDayTypeModal, setShowDayTypeModal] = useState(false);
  const [modalDayType, setModalDayType] = useState<"odd" | "even" | null>(null);
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

  const openDayTypeModal = (dayType: "odd" | "even") => {
    setActiveTab(dayType); // only for highlighting in calendar
    setModalDayType(dayType);
    setShowDayTypeModal(true);
  };

  const closeDayTypeModal = () => {
    setShowDayTypeModal(false);
    setModalDayType(null);
    setEditingLesson(null);
    setShowAddModal(false);
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
    showAlert(`Lesson added to all ${activeTab === "odd" ? "odd" : "even"} days`, "success");
  };

  const updateLesson = (lessonId: string, updatedLesson: Omit<Lesson, "id">) => {
    const dayTypeKey = activeTab === "odd" ? "oddDays" : "evenDays";
    const newSchedule = {
      ...schedule,
      [dayTypeKey]: schedule[dayTypeKey].map((lesson) =>
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
    const dayTypeKey = activeTab === "odd" ? "oddDays" : "evenDays";
    const newSchedule = {
      ...schedule,
      [dayTypeKey]: schedule[dayTypeKey].filter((lesson) => lesson.id !== lessonId),
    };
    
    setSchedule(newSchedule);
    autoSaveSchedule(newSchedule);
    showAlert("Lesson deleted", "success");
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isOddDay = (day: number) => day % 2 !== 0;
  const isEvenDay = (day: number) => day % 2 === 0;

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getLessonsForDay = (day: number) => {
    if (activeTab === "odd" && isOddDay(day)) {
      return schedule.oddDays || [];
    } else if (activeTab === "even" && isEvenDay(day)) {
      return schedule.evenDays || [];
    }
    return [];
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-32 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const lessons = getLessonsForDay(day);
      const isHighlighted = 
        (activeTab === "odd" && isOddDay(day)) || 
        (activeTab === "even" && isEvenDay(day));
      
      days.push(
        <div
          key={day}
          className={`min-h-32 border border-gray-200 p-2 ${
            isHighlighted
              ? activeTab === "odd"
                ? "bg-purple-50 border-purple-300"
                : "bg-blue-50 border-blue-300"
              : "bg-white"
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${
            isHighlighted
              ? activeTab === "odd"
                ? "text-purple-700"
                : "text-blue-700"
              : "text-gray-700"
          }`}>
            {day}
          </div>
          
          {lessons.length > 0 && (
            <div className="space-y-1">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`text-xs p-1.5 rounded ${
                    activeTab === "odd"
                      ? "bg-purple-100 text-purple-900"
                      : "bg-blue-100 text-blue-900"
                  }`}
                >
                  <div className="font-semibold truncate">{lesson.className}</div>
                  <div className="flex items-center gap-1 text-[10px] opacity-80">
                    <Clock className="w-3 h-3" />
                    {lesson.timeSlot}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-64 mb-8"></div>
          <div className="h-96 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Schedule</h1>
        </div>
        <p className="text-gray-600">Choose odd/even days and manage lessons for this month.</p>
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

      {/* Two buttons ABOVE calendar (open modal) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start gap-3 mb-4">
        <button
          type="button"
          onClick={() => openDayTypeModal("odd")}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition shadow-sm ${
            activeTab === "odd"
              ? "bg-purple-600 text-white"
              : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
          }`}
        >
          Odd days
        </button>
        <button
          type="button"
          onClick={() => openDayTypeModal("even")}
          className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition shadow-sm ${
            activeTab === "even"
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
          }`}
        >
          Even days
        </button>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex items-center gap-4">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Calendar Grid (month days below buttons) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>

      {/* Day modal (opens on button click) */}
      {showDayTypeModal && modalDayType && (
        <SimpleDayModal
          dayType={modalDayType}
          lessons={schedule[modalDayType === "odd" ? "oddDays" : "evenDays"] || []}
          onClose={closeDayTypeModal}
          onAdd={() => {
            setEditingLesson(null);
            setShowAddModal(true);
          }}
          onEdit={(lesson) => {
            setEditingLesson(lesson);
            setShowAddModal(true);
          }}
          onDelete={(lessonId) => deleteLesson(lessonId)}
        />
      )}

      {/* Add/Edit lesson modal (opened from the day modal) */}
      {showAddModal && modalDayType && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowAddModal(false);
            setEditingLesson(null);
          }}
          onSave={(lesson) => {
            if (editingLesson) updateLesson(editingLesson.id, lesson);
            else addLesson(lesson);
          }}
          dayType={modalDayType}
        />
      )}
    </div>
  );
}

function SimpleDayModal({
  dayType,
  lessons,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}: {
  dayType: "odd" | "even";
  lessons: Lesson[];
  onClose: () => void;
  onAdd: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}) {
  const accent = dayType === "odd" ? "purple" : "blue";
  const header =
    dayType === "odd"
      ? "bg-gradient-to-r from-purple-500 to-purple-600"
      : "bg-gradient-to-r from-blue-500 to-blue-600";
  const addBtn = dayType === "odd" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700";
  const border = dayType === "odd" ? "border-purple-200" : "border-blue-200";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className={`${header} text-white p-5 flex items-center justify-between`}>
          <div>
            <div className="text-xl font-bold">{dayType === "odd" ? "Odd days" : "Even days"}</div>
            <div className="text-sm opacity-90">
              {dayType === "odd" ? "Applies to 1, 3, 5, 7..." : "Applies to 2, 4, 6, 8..."}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              Lessons: <span className="font-semibold text-gray-900">{lessons.length}</span>
            </div>
            <button type="button" onClick={onAdd} className={`inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-lg transition shadow-sm ${addBtn}`}>
              <Plus className="w-4 h-4" />
              Add lesson
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-14 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-base font-semibold text-gray-900 mb-1">No lessons yet</div>
              <div className="text-sm text-gray-600">Add a lesson with students for {dayType} days.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className={`bg-white border-2 ${border} rounded-lg p-4`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate">{lesson.className}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.timeSlot}</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-2 py-1 rounded-md">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">${Number(lesson.hourlyRate || 0).toFixed(2)}/hr</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onEdit(lesson)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onDelete(lesson.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {lesson.students && lesson.students.length > 0 ? (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        {lesson.students.length} students
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lesson.students.map((s) => (
                          <span
                            key={s.id}
                            className={`px-2 py-1 text-xs rounded-full ${
                              accent === "purple" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {s.firstName} {s.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-gray-100 text-sm text-gray-600">
                      No students yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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




