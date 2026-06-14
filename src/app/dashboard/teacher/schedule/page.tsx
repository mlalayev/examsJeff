"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  LESSON_TYPE_OPTIONS,
  type LessonType,
} from "@/lib/schedule-validation";

const ACCENT = "#303380";

type ScheduleType = "ODD_DAYS" | "EVEN_DAYS";

const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// How many class chips to render inside a day cell before collapsing to "+X more".
const MAX_VISIBLE_CHIPS = 3;

type ClassRef = {
  id: string;
  name: string;
  _count?: { classStudents: number };
} | null;

type PerformanceRating =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "WEAK"
  | "DID_NOT_PARTICIPATE";

type Attendance = "PRESENT" | "ABSENT" | "LATE";

type Homework = "COMPLETED" | "INCOMPLETE" | "NOT_DONE" | "NOT_ASSIGNED";

type ScheduleSlot = {
  id: string;
  dayType: "ODD" | "EVEN";
  title: string;
  timeSlot: string;
  hourlyRate: string | number | null;
  class: ClassRef;
};

type LessonSession = {
  id: string;
  title: string;
  date: string;
  timeSlot: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduleSlotId: string | null;
  class: ClassRef;
  _count?: { studentRecords: number };
};

type MonthData = {
  year: number;
  month: number;
  oddDays: ScheduleSlot[];
  evenDays: ScheduleSlot[];
  lessons: LessonSession[];
};

type DayClass = {
  key: string;
  kind: "lesson" | "slot";
  title: string;
  timeSlot: string;
  className: string | null;
  classId: string | null;
  studentCount: number;
  slotId?: string;
  lessonId?: string;
  status?: LessonSession["status"];
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const dateKey = (year: number, month0: number, day: number) =>
  `${year}-${pad2(month0 + 1)}-${pad2(day)}`;

const isOddDay = (day: number) => day % 2 !== 0;

function sortByTime(a: DayClass, b: DayClass) {
  return a.timeSlot.localeCompare(b.timeSlot);
}

export default function TeacherSchedulePage() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [data, setData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Schedule controls
  const [slotsModal, setSlotsModal] = useState<"ODD" | "EVEN" | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<ScheduleType>("ODD_DAYS");
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackCtx, setFeedbackCtx] = useState<{
    date: string;
    dayClass: DayClass;
  } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const loadMonth = useCallback(
    async (year: number, month: number, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/teacher/schedule/month?year=${year}&month=${month + 1}`,
          { signal }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load schedule");
        }
        const json: MonthData = await res.json();
        setData(json);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("Load schedule error:", err);
        setError((err as Error).message || "Failed to load schedule");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadMonth(currentYear, currentMonth, controller.signal);
    return () => controller.abort();
  }, [currentYear, currentMonth, loadMonth]);

  const goToPreviousMonth = () => {
    setSelectedDay(null);
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const goToNextMonth = () => {
    setSelectedDay(null);
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const goToToday = () => {
    setSelectedDay(null);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const createClassWithSchedule = useCallback(
    async (input: {
      lessonType: LessonType;
      scheduleType: ScheduleType;
      startTime: string;
      endTime: string;
      students: { name: string; email: string }[];
    }) => {
      const res = await fetch("/api/teacher/schedule/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to create class");
      }
      await loadMonth(currentYear, currentMonth);
      showToast(
        `Class added to all ${
          input.scheduleType === "ODD_DAYS" ? "odd" : "even"
        } days`
      );
    },
    [currentMonth, currentYear, loadMonth, showToast]
  );

  const deleteSlot = useCallback(
    async (slotId: string) => {
      const res = await fetch(`/api/teacher/schedule/slots/${slotId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to delete schedule");
      }
      await loadMonth(currentYear, currentMonth);
      showToast("Schedule removed");
    },
    [currentMonth, currentYear, loadMonth, showToast]
  );

  const openAdd = (preset: ScheduleType) => {
    setAddPreset(preset);
    setSlotsModal(null);
    setAddOpen(true);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const classesForDay = useCallback(
    (day: number, dayOfWeek: number): DayClass[] => {
      if (!data) return [];

      const base =
        dayOfWeek === 0 ? [] : isOddDay(day) ? data.oddDays : data.evenDays;

      // Concrete lessons already created for this date (these take precedence
      // and carry their own materialised state / records).
      const lessonChips: DayClass[] = data.lessons
        .filter((l) => new Date(l.date).getUTCDate() === day)
        .map((l) => ({
          key: `lesson-${l.id}`,
          kind: "lesson",
          title: l.title,
          timeSlot: l.timeSlot,
          className: l.class?.name ?? null,
          classId: l.class?.id ?? null,
          studentCount: l.class?._count?.classStudents ?? 0,
          lessonId: l.id,
          status: l.status,
        }));

      // Recurring slots: skip ones already materialised into a lesson for this
      // date+slot so a class isn't listed twice.
      const materialisedSlotIds = new Set(
        data.lessons
          .filter((l) => new Date(l.date).getUTCDate() === day)
          .map((l) => l.scheduleSlotId)
          .filter(Boolean) as string[]
      );

      const slotChips: DayClass[] = base
        .filter((s) => !materialisedSlotIds.has(s.id))
        .map((s) => ({
          key: `slot-${s.id}-${day}`,
          kind: "slot",
          title: s.title,
          timeSlot: s.timeSlot,
          className: s.class?.name ?? null,
          classId: s.class?.id ?? null,
          studentCount: s.class?._count?.classStudents ?? 0,
          slotId: s.id,
        }));

      return [...lessonChips, ...slotChips].sort(sortByTime);
    },
    [data]
  );

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const cellBackground = (day: number, dayOfWeek: number) => {
    if (dayOfWeek === 0) return "bg-amber-50"; // Sunday → light yellow
    if (isOddDay(day)) return "bg-blue-50"; // Odd days → light blue
    return "bg-gray-50"; // Even days → light gray
  };

  const selectedDayClasses = useMemo(() => {
    if (selectedDay === null) return [];
    const dow = new Date(currentYear, currentMonth, selectedDay).getDay();
    return classesForDay(selectedDay, dow);
  }, [selectedDay, currentMonth, currentYear, classesForDay]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-500" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Schedule
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Your monthly teaching calendar.
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={goToNextMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Month + year label and legend */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">
          {MONTHS[currentMonth]} {currentYear}
        </h2>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
          <LegendSwatch className="bg-amber-50 border-amber-200" label="Sunday" />
          <LegendSwatch className="bg-blue-50 border-blue-200" label="Odd day" />
          <LegendSwatch className="bg-gray-50 border-gray-200" label="Even day" />
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full ring-2 ring-offset-1"
              style={{ ["--tw-ring-color" as string]: ACCENT, color: ACCENT }}
            />
            Today
          </span>
        </div>
      </div>

      {/* Schedule controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setSlotsModal("ODD")}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
          >
            Odd Days Classes
          </button>
          <button
            type="button"
            onClick={() => setSlotsModal("EVEN")}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
          >
            Even Days Classes
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Calendar */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70">
          {WEEKDAYS_FULL.map((day, i) => (
            <div
              key={day}
              className="border-r border-slate-200 p-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-600 last:border-r-0 sm:text-xs"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <CalendarSkeleton />
        ) : (
          <div className="grid grid-cols-7">
            {/* Leading blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`blank-${i}`}
                className="min-h-20 border-b border-r border-slate-200 bg-slate-50/40 last:border-r-0 sm:min-h-28"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayOfWeek = new Date(
                currentYear,
                currentMonth,
                day
              ).getDay();
              const dayClasses = classesForDay(day, dayOfWeek);
              const todayCell = isToday(day);
              const visible = dayClasses.slice(0, MAX_VISIBLE_CHIPS);
              const overflow = dayClasses.length - visible.length;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative min-h-20 border-b border-r border-slate-200 p-1.5 text-left align-top transition last:border-r-0 hover:brightness-[0.97] focus:outline-none focus:ring-2 focus:ring-[#303380]/50 sm:min-h-28 ${cellBackground(
                    day,
                    dayOfWeek
                  )} ${todayCell ? "z-10 ring-2 ring-inset ring-[#303380]" : ""}`}
                  aria-label={`${MONTHS[currentMonth]} ${day}, ${currentYear}`}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={
                        todayCell
                          ? "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums text-white"
                          : "px-1 text-xs font-semibold tabular-nums text-slate-700"
                      }
                      style={
                        todayCell ? { backgroundColor: ACCENT } : undefined
                      }
                    >
                      {day}
                    </span>

                    {/* Mobile: count badge */}
                    {dayClasses.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-white/80 px-1.5 text-[10px] font-semibold text-slate-600 sm:hidden">
                        {dayClasses.length}
                      </span>
                    )}
                  </div>

                  {/* sm+ : class chips */}
                  <div className="hidden space-y-1 sm:block">
                    {visible.map((c) => (
                      <div
                        key={c.key}
                        className="truncate rounded border border-slate-200 bg-white/80 px-1.5 py-1 text-[11px] text-slate-800"
                        title={`${c.title}${
                          c.className ? ` · ${c.className}` : ""
                        } (${c.timeSlot})`}
                      >
                        <div className="truncate font-semibold">{c.title}</div>
                        <div className="flex items-center gap-1 text-[10px] tabular-nums text-slate-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">{c.timeSlot}</span>
                        </div>
                      </div>
                    ))}

                    {overflow > 0 && (
                      <div className="px-1 text-[11px] font-medium text-slate-500">
                        +{overflow} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail modal */}
      {selectedDay !== null && (
        <DayDetailModal
          weekday={
            WEEKDAYS_FULL[
              new Date(currentYear, currentMonth, selectedDay).getDay()
            ]
          }
          dateLabel={`${MONTHS[currentMonth]} ${selectedDay}, ${currentYear}`}
          classes={selectedDayClasses}
          onSelectClass={(dayClass) =>
            setFeedbackCtx({
              date: dateKey(currentYear, currentMonth, selectedDay),
              dayClass,
            })
          }
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Lesson feedback modal */}
      {feedbackCtx && (
        <LessonFeedbackModal
          date={feedbackCtx.date}
          dayClass={feedbackCtx.dayClass}
          onClose={() => setFeedbackCtx(null)}
          onSaved={() => {
            loadMonth(currentYear, currentMonth);
            showToast("Lesson feedback saved");
          }}
        />
      )}

      {/* Odd / Even day class list modal */}
      {slotsModal && data && (
        <SlotsListModal
          dayType={slotsModal}
          slots={slotsModal === "ODD" ? data.oddDays : data.evenDays}
          onAdd={() =>
            openAdd(slotsModal === "ODD" ? "ODD_DAYS" : "EVEN_DAYS")
          }
          onDelete={deleteSlot}
          onClose={() => setSlotsModal(null)}
        />
      )}

      {/* Add schedule modal */}
      {addOpen && (
        <AddScheduleModal
          preset={addPreset}
          onClose={() => setAddOpen(false)}
          onCreate={createClassWithSchedule}
        />
      )}
    </div>
  );
}

function LegendSwatch({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded border ${className}`} />
      {label}
    </span>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="min-h-20 animate-pulse border-b border-r border-slate-200 bg-slate-50 last:border-r-0 sm:min-h-28"
        />
      ))}
    </div>
  );
}

function DayDetailModal({
  weekday,
  dateLabel,
  classes,
  onSelectClass,
  onClose,
}: {
  weekday: string;
  dateLabel: string;
  classes: DayClass[];
  onSelectClass: (dayClass: DayClass) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className="mt-1 h-2 w-2 rounded-full"
              style={{ backgroundColor: ACCENT }}
              aria-hidden
            />
            <div>
              <div className="text-base font-semibold text-gray-900">
                {weekday}
              </div>
              <div className="text-sm text-gray-500">{dateLabel}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto p-5">
          {classes.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-gray-500">
              No classes scheduled for this day.
            </div>
          ) : (
            classes.map((c) => (
              <button
                type="button"
                key={c.key}
                onClick={() => onSelectClass(c)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-[#303380]/40 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#303380]/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-gray-900">
                      {c.className ?? c.title}
                    </span>
                    {c.kind === "lesson" && c.status && (
                      <StatusBadge status={c.status} />
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {c.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LessonSession["status"] }) {
  const styles: Record<LessonSession["status"], string> = {
    SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function SlotsListModal({
  dayType,
  slots,
  onAdd,
  onDelete,
  onClose,
}: {
  dayType: "ODD" | "EVEN";
  slots: ScheduleSlot[];
  onAdd: () => void;
  onDelete: (slotId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const label = dayType === "ODD" ? "Odd Days" : "Even Days";

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              />
              <div className="text-base font-semibold text-gray-900">
                {label} Classes
              </div>
            </div>
            <div className="mt-0.5 text-sm text-gray-500">
              {dayType === "ODD"
                ? "Applies to every odd-numbered day of the month."
                : "Applies to every even-numbered day of the month."}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto p-5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {slots.length} schedule{slots.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus className="h-4 w-4" />
              Add {label} class
            </button>
          </div>

          {slots.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-gray-500">
              No {label.toLowerCase()} classes yet.
            </div>
          ) : (
            slots.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-gray-900">
                    {s.class?.name ?? s.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs tabular-nums text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    {s.timeSlot}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

type RosterDraft = { name: string; email: string };

function AddScheduleModal({
  preset,
  onClose,
  onCreate,
}: {
  preset: ScheduleType;
  onClose: () => void;
  onCreate: (input: {
    lessonType: LessonType;
    scheduleType: ScheduleType;
    startTime: string;
    endTime: string;
    students: RosterDraft[];
  }) => Promise<void>;
}) {
  const dayLabel = preset === "ODD_DAYS" ? "Odd Days" : "Even Days";

  const [lessonType, setLessonType] = useState<LessonType | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [students, setStudents] = useState<RosterDraft[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emailIsValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addStudent = () => {
    setRosterError(null);
    const name = studentName.trim();
    const email = studentEmail.trim();
    if (!name) {
      setRosterError("Enter the student's name.");
      return;
    }
    if (!emailIsValid(email)) {
      setRosterError("Enter a valid student email.");
      return;
    }
    if (students.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      setRosterError("That student is already in the list.");
      return;
    }
    setStudents((prev) => [...prev, { name, email }]);
    setStudentName("");
    setStudentEmail("");
  };

  const removeStudent = (email: string) =>
    setStudents((prev) => prev.filter((s) => s.email !== email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!lessonType) {
      setFormError("Please choose a lesson type.");
      return;
    }
    if (!startTime || !endTime) {
      setFormError("Please set both a start time and an end time.");
      return;
    }
    if (endTime <= startTime) {
      setFormError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        lessonType,
        scheduleType: preset,
        startTime,
        endTime,
        students,
      });
      onClose();
    } catch (err) {
      setFormError((err as Error).message || "Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="my-8 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ACCENT }}
              aria-hidden
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add {dayLabel} Class
              </h2>
              <p className="text-xs text-gray-500">
                Applies to every {dayLabel.toLowerCase()} of the month.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Lesson type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lesson type *
            </label>
            <select
              value={lessonType}
              onChange={(e) => setLessonType(e.target.value as LessonType | "")}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
              required
            >
              <option value="">Select a lesson type</option>
              {LESSON_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
                required
              />
            </div>
          </div>

          {/* Students */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Students
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Add students by name and the email of their existing student
              account.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30 sm:w-2/5"
              />
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addStudent();
                  }
                }}
                placeholder="student@example.com"
                className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
              />
              <button
                type="button"
                onClick={addStudent}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {rosterError && (
              <p className="mt-1.5 text-xs text-rose-600">{rosterError}</p>
            )}

            {students.length > 0 && (
              <ul className="mt-3 space-y-2">
                {students.map((s) => (
                  <li
                    key={s.email}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {s.name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {s.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStudent(s.email)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-700 transition hover:bg-rose-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : `Add ${dayLabel} Class`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ATTENDANCE_OPTIONS: { value: Attendance; label: string }[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
];

const PERFORMANCE_OPTIONS: { value: PerformanceRating; label: string }[] = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "AVERAGE", label: "Average" },
  { value: "WEAK", label: "Weak" },
  { value: "DID_NOT_PARTICIPATE", label: "Did not participate" },
];

const HOMEWORK_OPTIONS: { value: Homework; label: string }[] = [
  { value: "COMPLETED", label: "Completed" },
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "NOT_DONE", label: "Not submitted" },
  { value: "NOT_ASSIGNED", label: "Not assigned" },
];

type StudentRow = {
  studentId: string;
  name: string;
  attendance: Attendance;
  lateMinutes: string;
  performance: PerformanceRating | "";
  homeworkStatus: Homework;
  feedback: string;
  behaviorNote: string;
};

type ResolvedRecord = {
  studentId: string;
  attendance: Attendance | "EXCUSED";
  lateMinutes: number;
  performance: PerformanceRating | null;
  homeworkStatus: Homework | "ASSIGNED";
  feedback: string | null;
  behaviorNote: string | null;
};

type ResolvedLesson = {
  lesson: {
    id: string;
    title: string;
    date: string;
    timeSlot: string;
    topic: string | null;
    class: ClassRef;
  };
  students: { id: string; name: string; email: string }[];
  records: ResolvedRecord[];
};

function LessonFeedbackModal({
  date,
  dayClass,
  onClose,
  onSaved,
}: {
  date: string;
  dayClass: DayClass;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/teacher/lessons/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            scheduleSlotId: dayClass.slotId,
            lessonId: dayClass.lessonId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load lesson");
        if (cancelled) return;

        const resolved = data as ResolvedLesson;
        setLessonId(resolved.lesson.id);
        setTopic(resolved.lesson.topic ?? "");

        const byStudent = new Map(
          resolved.records.map((r) => [r.studentId, r])
        );
        setRows(
          resolved.students.map((s) => {
            const rec = byStudent.get(s.id);
            return {
              studentId: s.id,
              name: s.name,
              attendance:
                rec?.attendance && rec.attendance !== "EXCUSED"
                  ? rec.attendance
                  : "PRESENT",
              lateMinutes: rec?.lateMinutes ? String(rec.lateMinutes) : "",
              performance: rec?.performance ?? "",
              homeworkStatus:
                rec?.homeworkStatus && rec.homeworkStatus !== "ASSIGNED"
                  ? rec.homeworkStatus
                  : "NOT_ASSIGNED",
              feedback: rec?.feedback ?? "",
              behaviorNote: rec?.behaviorNote ?? "",
            };
          })
        );
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date, dayClass]);

  const updateRow = (id: string, patch: Partial<StudentRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.studentId === id ? { ...r, ...patch } : r))
    );

  const handleSave = async () => {
    if (!lessonId || rows.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/lessons/${lessonId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || null,
          records: rows.map((r) => ({
            studentId: r.studentId,
            attendance: r.attendance,
            lateMinutes:
              r.attendance === "LATE"
                ? parseInt(r.lateMinutes, 10) || 0
                : 0,
            performance: r.performance || null,
            homeworkStatus: r.homeworkStatus,
            feedback: r.feedback.trim() || null,
            behaviorNote: r.behaviorNote.trim() || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save feedback");
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = dayClass.className ?? dayClass.title;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              />
              <h2 className="truncate text-base font-semibold text-gray-900">
                {title}
              </h2>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs tabular-nums text-slate-500">
              <span>{date}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {dayClass.timeSlot}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {rows.length} student{rows.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading lesson…
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </div>
              )}

              {/* Lesson topic */}
              <div className="mb-5">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Lesson topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Present perfect tense, Reading practice…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
                />
              </div>

              {rows.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-gray-500">
                  No students enrolled in this class yet. Add students to the
                  class to record attendance and feedback.
                </div>
              ) : (
                <div className="space-y-4">
                  {rows.map((r) => (
                    <StudentFeedbackCard
                      key={r.studentId}
                      row={r}
                      onChange={(patch) => updateRow(r.studentId, patch)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || rows.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentFeedbackCard({
  row,
  onChange,
}: {
  row: StudentRow;
  onChange: (patch: Partial<StudentRow>) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 font-semibold text-gray-900">{row.name}</div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Attendance */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Attendance
          </label>
          <div className="inline-flex w-full rounded-lg border border-gray-200 bg-white p-1">
            {ATTENDANCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ attendance: o.value })}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  row.attendance === o.value
                    ? "text-white shadow-sm"
                    : "text-gray-700 hover:bg-slate-50"
                }`}
                style={
                  row.attendance === o.value
                    ? { backgroundColor: ACCENT }
                    : undefined
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Late minutes */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Late minutes
          </label>
          <input
            type="number"
            min={0}
            max={600}
            value={row.lateMinutes}
            disabled={row.attendance !== "LATE"}
            onChange={(e) => onChange({ lateMinutes: e.target.value })}
            placeholder={row.attendance === "LATE" ? "e.g., 10" : "—"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        {/* Performance */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Performance
          </label>
          <select
            value={row.performance}
            onChange={(e) =>
              onChange({ performance: e.target.value as PerformanceRating | "" })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
          >
            <option value="">Not rated</option>
            {PERFORMANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Homework */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Homework
          </label>
          <select
            value={row.homeworkStatus}
            onChange={(e) =>
              onChange({ homeworkStatus: e.target.value as Homework })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
          >
            {HOMEWORK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Teacher feedback note */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Teacher feedback note
          </label>
          <textarea
            rows={2}
            value={row.feedback}
            onChange={(e) => onChange({ feedback: e.target.value })}
            placeholder="Feedback for the student / parent…"
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
          />
        </div>

        {/* Behavior note */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Behavior note
          </label>
          <textarea
            rows={2}
            value={row.behaviorNote}
            onChange={(e) => onChange({ behaviorNote: e.target.value })}
            placeholder="Behavior observations…"
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#303380] focus:ring-2 focus:ring-[#303380]/30"
          />
        </div>
      </div>
    </div>
  );
}
