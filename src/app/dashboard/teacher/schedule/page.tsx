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
  const [slideState, setSlideState] = useState<{
    isAnimating: boolean;
    dir: "prev" | "next";
    nextMonth: number;
    nextYear: number;
  } | null>(null);
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
    if (slideState?.isAnimating) return;
    const nextMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const nextYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setSlideState({ isAnimating: true, dir: "prev", nextMonth, nextYear });
  };

  const goToNextMonth = () => {
    if (slideState?.isAnimating) return;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setSlideState({ isAnimating: true, dir: "next", nextMonth, nextYear });
  };

  const getLessonsForDay = (day: number, dayOfWeek: number) => {
    if (dayOfWeek === 0) return [];
    if (isOddDay(day)) {
      return schedule.oddDays || [];
    } else if (isEvenDay(day)) {
      return schedule.evenDays || [];
    }
    return [];
  };

  const addAllLessonsToCalendar = () => {
    showAlert("All lessons added to calendar", "success");
  };

  const ACCENT = "#303380";

  const renderCalendar = (month = currentMonth, year = currentYear) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-24 bg-slate-50/60 border border-slate-200"
        />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(year, month, day).getDay();
      const lessons = getLessonsForDay(day, dayOfWeek);
      
      let bgClass = "bg-white";
      if (dayOfWeek === 0) {
        bgClass = "bg-[#fef9c3]";
      } else if (isOddDay(day)) {
        bgClass = "bg-[#bfdbfe]";
      }
      
      days.push(
        <div
          key={day}
          className={`min-h-24 border border-slate-200 p-1.5 ${bgClass}`}
        >
          <div className="text-[11px] font-semibold mb-1.5 text-slate-700">
            {day}
          </div>
          
          {lessons.length > 0 && (
            <div className="space-y-1">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="text-[11px] p-1.5 rounded border border-slate-200 bg-white/70 text-slate-800"
                >
                  <div className="font-semibold truncate">{lesson.className}</div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 tabular-nums">
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

  const getMonthLabel = (month: number, year: number) => `${MONTHS[month]} ${year}`;

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
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-500" />
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
            Schedule
          </h1>
        </div>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Pick odd/even days and manage lessons for this month.
        </p>
      </div>

      {/* Alert */}
      {alert.show && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 flex items-start gap-3 text-sm ${
            alert.type === "success"
              ? "bg-emerald-50/60 text-emerald-900 border-emerald-200"
              : "bg-rose-50/60 text-rose-900 border-rose-200"
          }`}
        >
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span className="leading-relaxed">{alert.message}</span>
        </div>
      )}

      {/* Day type segmented control */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => openDayTypeModal("odd")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "odd"
                  ? "bg-[#303380] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Odd days
            </button>
            <button
              type="button"
              onClick={() => openDayTypeModal("even")}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "even"
                  ? "bg-[#303380] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Even days
            </button>
          </div>
          
          <button
            type="button"
            onClick={addAllLessonsToCalendar}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#303380] text-white rounded-lg hover:bg-[#252865] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Lessons
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums select-none">
            {getMonthLabel(currentMonth, currentYear)}
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50/70 border-b border-slate-200">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 last:border-r-0 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>
        <div
          className="relative overflow-hidden"
          onTransitionEnd={() => {
            if (!slideState?.isAnimating) return;
            setCurrentMonth(slideState.nextMonth);
            setCurrentYear(slideState.nextYear);
            setSlideState(null);
          }}
        >
          {slideState ? (
            <div
              className="flex w-[200%] will-change-transform"
              style={{
                transform: slideState.isAnimating ? (slideState.dir === "next" ? "translateX(-50%)" : "translateX(0%)") : "translateX(0%)",
                transition: "transform 260ms ease",
              }}
              ref={(el) => {
                if (!el) return;
                // trigger transition after mount
                requestAnimationFrame(() => {
                  if (!slideState?.isAnimating) return;
                  el.style.transform = slideState.dir === "next" ? "translateX(-50%)" : "translateX(50%)";
                });
              }}
            >
              {/* current month */}
              <div className="w-1/2">
                <div className="grid grid-cols-7">{renderCalendar(currentMonth, currentYear)}</div>
              </div>
              {/* next/prev month */}
              <div className="w-1/2">
                <div className="grid grid-cols-7">{renderCalendar(slideState.nextMonth, slideState.nextYear)}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7">{renderCalendar(currentMonth, currentYear)}</div>
          )}
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
  const ACCENT = "#303380";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden max-h-[90vh] flex flex-col shadow-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
              <div className="text-lg font-semibold text-gray-900">
                {dayType === "odd" ? "Odd days" : "Even days"}
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {dayType === "odd" ? "Applies to 1, 3, 5, 7…" : "Applies to 2, 4, 6, 8…"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="text-sm text-gray-600">
              Lessons:{" "}
              <span className="font-semibold text-gray-900 tabular-nums">{lessons.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition"
                style={{ backgroundColor: ACCENT }}
              >
                <Plus className="w-4 h-4" />
                Add lesson
              </button>
            </div>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-14 bg-slate-50/60 rounded-xl border border-slate-200">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <div className="text-base font-semibold text-gray-900 mb-1">No lessons yet</div>
              <div className="text-sm text-gray-500">
                Add a lesson to start building your {dayType === "odd" ? "odd-day" : "even-day"} schedule.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{lesson.className}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 tabular-nums">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.timeSlot}</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">${Number(lesson.hourlyRate || 0).toFixed(2)}/hr</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(lesson)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(lesson.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-700 shadow-sm transition hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {lesson.students && lesson.students.length > 0 ? (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        {lesson.students.length} students
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lesson.students.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
                          >
                            {s.firstName} {s.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 text-sm text-gray-500">
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
  const ACCENT = "#303380";
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8 shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} aria-hidden />
              <h2 className="text-lg font-semibold text-gray-900">
                {lesson ? "Edit lesson" : "Add lesson"}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {dayType === "odd" ? "Odd days" : "Even days"} • 1-hour slot
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name *
            </label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none bg-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
              placeholder="e.g., 50.00"
              required
            />
          </div>

          {/* Students Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Students ({students.length})
              </label>
              <button
                type="button"
                onClick={() => setShowStudentForm(!showStudentForm)}
                className="text-sm font-medium flex items-center gap-1 text-[#303380] hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>

            {/* Add Student Form */}
            {showStudentForm && (
              <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-xl mb-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none bg-white"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none bg-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addStudent}
                    disabled={!firstName.trim() || !lastName.trim()}
                    className="px-3 py-1.5 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    style={{ backgroundColor: ACCENT }}
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
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-50 shadow-sm"
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
                    className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200 rounded-xl"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStudent(student.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-700 shadow-sm transition hover:bg-rose-50"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No students added yet.</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white rounded-lg transition text-sm font-medium shadow-sm"
              style={{ backgroundColor: ACCENT }}
            >
              {lesson ? "Update lesson" : "Add lesson"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




