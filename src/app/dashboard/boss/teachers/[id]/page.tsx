"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  X,
  LayoutGrid,
  CalendarDays,
} from "lucide-react";

type Student = { id: string; firstName: string; lastName: string };

type Lesson = {
  id: string;
  className: string;
  timeSlot: string;
  students: Student[];
  hourlyRate: number;
};

type DayOverride = {
  addedLessons: Lesson[];
  hiddenLessonIds: string[];
};

type Schedule = {
  oddDays: Lesson[];
  evenDays: Lesson[];
  dayOverrides?: Record<string, DayOverride>;
};

type Teacher = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  approved: boolean;
  createdAt: string;
  branch: { id: string; name: string } | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  program: string | null;
  classes: { id: string; name: string; students: number }[];
};

const ACCENT = "#303380";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dateKeyOf = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const formatDateLong = (year: number, month: number, day: number) =>
  new Date(year, month, day).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const isOddDay = (day: number) => day % 2 !== 0;

export default function BossTeacherDetailPage() {
  const params = useParams();
  const teacherId = params?.id as string;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({
    oddDays: [],
    evenDays: [],
    dayOverrides: {},
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [view, setView] = useState<"month" | "year">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/boss/teachers/${teacherId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setTeacher(data.teacher);
          setSchedule(
            data.schedule || { oddDays: [], evenDays: [], dayOverrides: {} }
          );
        }
      } catch (error) {
        console.error("Failed to load teacher:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId]);

  const getOverrideForDate = (dateKey: string): DayOverride =>
    schedule.dayOverrides?.[dateKey] || { addedLessons: [], hiddenLessonIds: [] };

  const getBaseLessonsForDay = (day: number, dayOfWeek: number): Lesson[] => {
    if (dayOfWeek === 0) return [];
    if (isOddDay(day)) return schedule.oddDays || [];
    return schedule.evenDays || [];
  };

  const getLessonsForDay = (
    day: number,
    dayOfWeek: number,
    year: number,
    month: number
  ): Lesson[] => {
    const base = getBaseLessonsForDay(day, dayOfWeek);
    const override = getOverrideForDate(dateKeyOf(year, month, day));
    const hidden = new Set(override.hiddenLessonIds);
    const visibleBase = base.filter((l) => !hidden.has(l.id));
    return [...visibleBase, ...override.addedLessons];
  };

  const countLessonsInMonth = (month: number, year: number) => {
    const days = new Date(year, month + 1, 0).getDate();
    let total = 0;
    for (let day = 1; day <= days; day++) {
      const dow = new Date(year, month, day).getDay();
      total += getLessonsForDay(day, dow, year, month).length;
    }
    return total;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((m) => (m === 0 ? 11 : m - 1));
    if (currentMonth === 0) setCurrentYear((y) => y - 1);
  };

  const goToNextMonth = () => {
    setCurrentMonth((m) => (m === 11 ? 0 : m + 1));
    if (currentMonth === 11) setCurrentYear((y) => y + 1);
  };

  const displayName = teacher
    ? [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() ||
      teacher.email.split("@")[0]
    : "";

  const yearLessonTotal = useMemo(() => {
    let total = 0;
    for (let m = 0; m < 12; m++) total += countLessonsInMonth(m, currentYear);
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, schedule]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-40" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !teacher) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/dashboard/boss/teachers"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to teachers
        </Link>
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg text-gray-500">
          Teacher not found.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/boss/teachers"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to teachers
      </Link>

      {/* Teacher header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0"
            style={{ backgroundColor: ACCENT }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {displayName}
              </h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  teacher.approved
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {teacher.approved ? "Approved" : "Pending"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-gray-400" />
                {teacher.email}
              </span>
              {teacher.phoneNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {teacher.phoneNumber}
                </span>
              )}
              {teacher.branch && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {teacher.branch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {teacher.classes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Classes ({teacher.classes.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {teacher.classes.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-700"
                >
                  {c.name}
                  <span className="inline-flex items-center gap-0.5 text-slate-500">
                    <Users className="w-3 h-3" />
                    {c.students}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-medium text-gray-900">Schedule</h2>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setView("month")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "month"
                ? "text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            style={view === "month" ? { backgroundColor: ACCENT } : {}}
          >
            <CalendarDays className="w-4 h-4" />
            Month
          </button>
          <button
            type="button"
            onClick={() => setView("year")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              view === "year"
                ? "text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-50"
            }`}
            style={view === "year" ? { backgroundColor: ACCENT } : {}}
          >
            <LayoutGrid className="w-4 h-4" />
            Year
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          month={currentMonth}
          year={currentYear}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
          getLessonsForDay={getLessonsForDay}
          getOverrideForDate={getOverrideForDate}
          onSelectDate={setSelectedDateKey}
        />
      ) : (
        <YearView
          year={currentYear}
          totalLessons={yearLessonTotal}
          onPrevYear={() => setCurrentYear((y) => y - 1)}
          onNextYear={() => setCurrentYear((y) => y + 1)}
          countLessonsInMonth={countLessonsInMonth}
          onOpenMonth={(m) => {
            setCurrentMonth(m);
            setView("month");
          }}
        />
      )}

      {/* Per-day detail modal (read-only) */}
      {selectedDateKey &&
        (() => {
          const [y, m, d] = selectedDateKey.split("-").map(Number);
          const dow = new Date(y, m - 1, d).getDay();
          const lessons = getLessonsForDay(d, dow, y, m - 1);
          return (
            <DayDetailModal
              dateLabel={formatDateLong(y, m - 1, d)}
              lessons={lessons}
              onClose={() => setSelectedDateKey(null)}
            />
          );
        })()}
    </div>
  );
}

function MonthView({
  month,
  year,
  onPrev,
  onNext,
  getLessonsForDay,
  getOverrideForDate,
  onSelectDate,
}: {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  getLessonsForDay: (
    day: number,
    dayOfWeek: number,
    year: number,
    month: number
  ) => Lesson[];
  getOverrideForDate: (dateKey: string) => DayOverride;
  onSelectDate: (dateKey: string) => void;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(
      <div
        key={`empty-${i}`}
        className="min-h-24 bg-slate-50/60 border border-slate-200"
      />
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(year, month, day).getDay();
    const dateKey = dateKeyOf(year, month, day);
    const lessons = getLessonsForDay(day, dow, year, month);
    const override = getOverrideForDate(dateKey);
    const hasExtras = override.addedLessons.length > 0;
    const hasHidden = override.hiddenLessonIds.length > 0;
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const isSunday = dow === 0;

    let bgClass = "bg-white";
    if (isSunday) bgClass = "bg-[#fef9c3]";
    else if (isOddDay(day)) bgClass = "bg-[#bfdbfe]";

    cells.push(
      <button
        type="button"
        key={day}
        onClick={() => onSelectDate(dateKey)}
        className={`min-h-24 border border-slate-200 p-1.5 text-left transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#303380]/60 ${bgClass} ${
          isToday
            ? "ring-2 ring-[#303380] ring-offset-1 ring-offset-white relative z-10"
            : ""
        }`}
        aria-label={`Open schedule for ${formatDateLong(year, month, day)}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-[11px] font-semibold ${
              isToday
                ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#303380] text-white tabular-nums"
                : "text-slate-700"
            }`}
          >
            {day}
          </span>
          {(hasExtras || hasHidden) && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/70 border border-slate-300 text-slate-700">
              {hasExtras ? `+${override.addedLessons.length}` : ""}
              {hasHidden
                ? `${hasExtras ? " " : ""}-${override.hiddenLessonIds.length}`
                : ""}
            </span>
          )}
        </div>
        {lessons.length > 0 && (
          <div className="space-y-1">
            {lessons.slice(0, 3).map((lesson) => (
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
            {lessons.length > 3 && (
              <div className="text-[10px] text-slate-500 font-medium pl-1">
                +{lessons.length - 3} more
              </div>
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-base sm:text-lg font-semibold text-slate-900 tabular-nums select-none">
            {MONTHS[month]} {year}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-slate-50/70 border-b border-slate-200">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-[10px] font-semibold text-slate-600 border-r border-slate-200 last:border-r-0 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{cells}</div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#bfdbfe] border border-slate-300" />
          Odd days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-white border border-slate-300" />
          Even days
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#fef9c3] border border-slate-300" />
          Sunday (off)
        </span>
      </div>
    </>
  );
}

function YearView({
  year,
  totalLessons,
  onPrevYear,
  onNextYear,
  countLessonsInMonth,
  onOpenMonth,
}: {
  year: number;
  totalLessons: number;
  onPrevYear: () => void;
  onNextYear: () => void;
  countLessonsInMonth: (month: number, year: number) => number;
  onOpenMonth: (month: number) => void;
}) {
  const today = new Date();
  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevYear}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Previous year"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900 tabular-nums select-none">
              {year}
            </div>
            <div className="text-xs text-slate-500 tabular-nums">
              {totalLessons} lessons this year
            </div>
          </div>
          <button
            type="button"
            onClick={onNextYear}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
            aria-label="Next year"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {MONTHS.map((label, m) => {
          const count = countLessonsInMonth(m, year);
          const isCurrent =
            m === today.getMonth() && year === today.getFullYear();
          return (
            <button
              key={label}
              type="button"
              onClick={() => onOpenMonth(m)}
              className={`text-left bg-white border rounded-xl p-4 transition hover:shadow-md hover:border-gray-300 ${
                isCurrent ? "border-[#303380] ring-1 ring-[#303380]/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{label}</span>
                {isCurrent && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#303380]">
                    Now
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-bold text-gray-900 tabular-nums">
                  {count}
                </span>
                <span className="text-xs text-gray-500 mb-1">lessons</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function DayDetailModal({
  dateLabel,
  lessons,
  onClose,
}: {
  dateLabel: string;
  lessons: Lesson[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl overflow-hidden max-h-[90vh] flex flex-col shadow-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              />
              <div className="text-lg font-semibold text-gray-900">{dateLabel}</div>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              {lessons.length} lesson{lessons.length === 1 ? "" : "s"} scheduled
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
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/60 rounded-xl border border-slate-200 text-sm text-gray-500">
              No lessons scheduled for this day.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="font-semibold text-gray-900 truncate">
                    {lesson.className}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 tabular-nums">
                    <Clock className="w-4 h-4" />
                    {lesson.timeSlot}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">
                      ${Number(lesson.hourlyRate || 0).toFixed(2)}/hr
                    </span>
                  </div>
                  {lesson.students && lesson.students.length > 0 ? (
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        {lesson.students.length} student
                        {lesson.students.length === 1 ? "" : "s"}
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
                    <div className="pt-3 mt-3 border-t border-slate-100 text-sm text-gray-500">
                      No students listed.
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
