"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Clock, BookOpen, Save, AlertCircle } from "lucide-react";
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
  const { data: session } = useSession();
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Schedule</h1>
        </div>
        <p className="text-gray-600">Manage your lessons for odd and even days</p>
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => {
            setEditingLesson(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Lesson to {activeTab === "odd" ? "Odd" : "Even"} Days
        </button>
        <button
          onClick={saveSchedule}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {/* Lessons List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No lessons scheduled for {activeTab === "odd" ? "odd" : "even"} days
            </h3>
            <p className="text-gray-600 mb-4">
              Click "Add Lesson" to create your first lesson for {activeTab === "odd" ? "odd" : "even"} days
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedLessons(schedule[activeTab === "odd" ? "oddDays" : "evenDays"]).map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{lesson.subject}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {lesson.startTime} - {lesson.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      {lesson.class && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          Class: {lesson.class}
                        </span>
                      )}
                      {lesson.room && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          Room: {lesson.room}
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
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit lesson"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete lesson"
                    >
                      <Trash2 className="w-5 h-5" />
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {lesson ? "Edit Lesson" : `Add Lesson to ${dayType === "odd" ? "Odd" : "Even"} Days`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject / Lesson Name *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., 10-A, Grade 9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Room 101, Lab 2"
            />
          </div>

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
              {lesson ? "Update" : "Add"} Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




