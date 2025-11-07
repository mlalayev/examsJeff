"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface AttemptItem {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  overallPercent: number | null;
  exam: { id: string; title: string; category: string; track?: string | null };
  class: { id: string; name: string; teacher?: { id: string; name?: string | null } } | null;
  sections: { type: string; rawScore: number | null; maxScore: number | null }[];
}

export default function StudentHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/student/attempts");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load attempts");
        setAttempts(json.attempts || []);
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load attempts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Exam History</h1>
      {loading ? (
        <UnifiedLoading type="spinner" variant="spinner" size="lg" />
      ) : attempts.length === 0 ? (
        <div className="text-gray-600">No attempts yet.</div>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => (
            <div key={a.id} className="border rounded bg-white p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{a.exam.category}{a.exam.track ? ` · ${a.exam.track}` : ""}</div>
                <div className="text-lg font-medium text-gray-900">{a.exam.title}</div>
                <div className="text-xs text-gray-500">{a.class ? `Class: ${a.class.name} ${a.class.teacher?.name ? ` · Teacher: ${a.class.teacher?.name}` : ""}` : "—"}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Overall</div>
                  <div className="text-lg font-semibold text-gray-900">{a.overallPercent != null ? `${a.overallPercent}%` : "—"}</div>
                </div>
                <Link href={`/attempts/${a.id}/results`} className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-800">
                  View Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




