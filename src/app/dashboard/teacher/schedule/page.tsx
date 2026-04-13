"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Clock, BookOpen, Save, AlertCircle, Pencil } from "lucide-react";
import { useSession } from "next-auth/react";

type Lesson = {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
  class?: string;
};

type Schedule = {
  oddDays: Lesson[];
  evenDays: Lesson[];
};

export default function TeacherSchedulePage() {
  useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      if (res.ok) {
        showAlert("Schedule saved successfully!", "success");
      } else {
        showAlert("Failed to save schedule", "error");
      }
    } catch (error) {
      showAlert("Failed to save schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 3000);
  };

  const addLesson = (lesson: Omit<Lesson, "id">) => {
    const newLesson = {
      ...lesson,
      id: `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setSchedule((prev) => ({
      ...prev,
      [activeTab === "odd" ? "oddDays" : "evenDays"]: [
        ...prev[activeTab === "odd" ? "oddDays" : "evenDays"],
        newLesson,
      ],
    }));

    setShowAddModal(false);
    setEditingLesson(null);
  };

  const updateLesson = (lessonId: string, updatedLesson: Omit<Lesson, "id">) => {
    const dayType = activeTab === "odd" ? "oddDays" : "evenDays";
    setSchedule((prev) => ({
      ...prev,
      [dayType]: prev[dayType].map((lesson) =>
        lesson.id === lessonId ? { ...updatedLesson, id: lessonId } : lesson
      ),
    }));
    setShowAddModal(false);
    setEditingLesson(null);
  };

  const deleteLesson = (lessonId: string) => {
    const dayType = activeTab === "odd" ? "oddDays" : "evenDays";
    setSchedule((prev) => ({
      ...prev,
      [dayType]: prev[dayType].filter((lesson) => lesson.id !== lessonId),
    }));
  };

  const sortedLessons = (lessons: Lesson[]) => {
    return [...lessons].sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      {/* Minimal Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" />
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900">Schedule</h1>
        </div>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Manage your lessons for odd/even days.
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

      {/* Compact Stats + Segmented Control */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Odd days:</span>
            <span className="font-medium">{schedule.oddDays.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Even days:</span>
            <span className="font-medium">{schedule.evenDays.length}</span>
          </div>
        </div>

        <div className="inline-flex w-full max-w-sm rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setActiveTab("odd")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "odd"
                ? "bg-[#303380] text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Odd days
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("even")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              activeTab === "even"
                ? "bg-[#303380] text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Even days
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition"
          style={{ backgroundColor: "#303380" }}
        >
          <Plus className="w-4 h-4" />
          Add lesson
        </button>
        <button
          onClick={saveSchedule}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 text-slate-600" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-1">
              No lessons yet
            </h3>
            <p className="text-sm text-gray-500">
              Add a lesson to start building your {activeTab === "odd" ? "odd-day" : "even-day"} schedule.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 sm:p-5 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{lesson.subject}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 tabular-nums">
                        <Clock className="w-4 h-4" />
                        <span>
                          {lesson.startTime} - {lesson.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {lesson.class && (
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                          Class: <span className="ml-1 font-medium text-gray-900">{lesson.class}</span>
                        </span>
                      )}
                      {lesson.room && (
                        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                          Room: <span className="ml-1 font-medium text-gray-900">{lesson.room}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingLesson(lesson);
                        setShowAddModal(true);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      title="Edit lesson"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-700 shadow-sm transition hover:bg-rose-50"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
  const [subject, setSubject] = useState(lesson?.subject || "");
  const [startTime, setStartTime] = useState(lesson?.startTime || "");
  const [endTime, setEndTime] = useState(lesson?.endTime || "");
  const [room, setRoom] = useState(lesson?.room || "");
  const [classInfo, setClassInfo] = useState(lesson?.class || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !startTime || !endTime) return;

    onSave({
      subject,
      startTime,
      endTime,
      room: room || undefined,
      class: classInfo || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {lesson ? "Edit lesson" : "Add lesson"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {dayType === "odd" ? "Odd days" : "Even days"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject / Lesson Name *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
              placeholder="e.g., Mathematics, English"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input
              type="text"
              value={classInfo}
              onChange={(e) => setClassInfo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
              placeholder="e.g., 10-A, Grade 9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#303380]/30 focus:border-[#303380] outline-none"
              placeholder="e.g., Room 101, Lab 2"
            />
          </div>

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
              style={{ backgroundColor: "#303380" }}
            >
              {lesson ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




