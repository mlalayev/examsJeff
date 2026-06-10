"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  UserCheck,
  Calendar,
  Users,
  BookOpen,
  Building2,
  ChevronRight,
  Phone,
} from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

type TeacherRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  approved: boolean;
  createdAt: string;
  branch: { id: string; name: string } | null;
  phoneNumber: string | null;
  program: string | null;
  hasSchedule: boolean;
  recurringLessons: number;
  classes: number;
  students: number;
};

const ACCENT = "#303380";

export default function BossTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/boss/teachers");
        if (res.ok) {
          const data = await res.json();
          setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
        }
      } catch (error) {
        console.error("Failed to load teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const branches = Array.from(
    new Map(
      teachers
        .filter((t) => t.branch)
        .map((t) => [t.branch!.id, t.branch!.name] as const)
    ).entries()
  );

  const filtered = teachers.filter((t) => {
    const name = `${t.firstName ?? ""} ${t.lastName ?? ""}`.toLowerCase();
    const matchesSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch =
      branchFilter === "all" || t.branch?.id === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const displayName = (t: TeacherRow) =>
    [t.firstName, t.lastName].filter(Boolean).join(" ").trim() ||
    t.email.split("@")[0];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-slate-500" />
          <h1 className="text-2xl font-medium text-gray-900">Teachers</h1>
        </div>
        <p className="text-gray-500 mt-1">
          View teacher accounts and open their full schedule for any month or year.
        </p>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-8 mb-8 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Total teachers:</span>
          <span className="font-medium">{teachers.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">With schedule:</span>
          <span className="font-medium">
            {teachers.filter((t) => t.hasSchedule).length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Pending:</span>
          <span className="font-medium text-orange-600">
            {teachers.filter((t) => !t.approved).length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        {branches.length > 0 && (
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">All Branches</option>
            {branches.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <UnifiedLoading type="skeleton" variant="table" count={1} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-lg text-gray-500">
          <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No teachers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/boss/teachers/${t.id}`}
              className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {displayName(t).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {displayName(t)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {t.email}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition flex-shrink-0" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    t.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {t.approved ? "Approved" : "Pending"}
                </span>
                {t.branch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                    <Building2 className="w-3 h-3" />
                    {t.branch.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-100 pt-3">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-semibold tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {t.recurringLessons}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Lessons
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-semibold tabular-nums">
                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                    {t.classes}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Classes
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-900 font-semibold tabular-nums">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {t.students}
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Students
                  </div>
                </div>
              </div>

              {t.phoneNumber && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  {t.phoneNumber}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
