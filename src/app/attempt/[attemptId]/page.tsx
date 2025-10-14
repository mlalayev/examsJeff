"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface AttemptData {
  attempt: { id: string; status: string; startedAt: string | null };
  exam: {
    id: string;
    title: string;
    category: string;
    track?: string | null;
    sections: Array<{
      id: string;
      type: string;
      title: string;
      durationMin: number;
      order: number;
      questions: Array<{
        id: string;
        qtype: string;
        prompt: any;
        options?: any;
        maxScore: number;
        order: number;
      }>;
    }>;
  };
}

type AnswersState = Record<string, Record<string, any>>; // sectionType -> { questionId: answer }

type DoneState = Record<string, boolean>; // sectionType -> done

export default function AttemptRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttemptData | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [done, setDone] = useState<DoneState>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load attempt");
      setData(json);
      // initialize answers and done state
      const initAnswers: AnswersState = {};
      const initDone: DoneState = {};
      json.exam.sections.forEach((s: any) => {
        initAnswers[s.type] = initAnswers[s.type] || {};
        initDone[s.type] = false;
      });
      setAnswers((prev) => ({ ...initAnswers, ...prev }));
      setDone((prev) => ({ ...initDone, ...prev }));
      setActiveSection(json.exam.sections[0]?.type || null);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to load attempt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const setAnswer = (sectionType: string, questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [sectionType]: { ...(prev[sectionType] || {}), [questionId]: value },
    }));
  };

  const saveSection = async (sectionType: string) => {
    setSaving(sectionType);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType, answers: answers[sectionType] || {} }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const markDone = (sectionType: string) => {
    setDone((prev) => ({ ...prev, [sectionType]: true }));
  };

  const submitAttempt = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submit failed");
      alert("Attempt submitted! Redirecting to dashboard...");
      router.push("/dashboard/student");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  const sections = data.exam.sections;
  const active = sections.find((s) => s.type === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Sections</h2>
              <p className="text-xs text-gray-500">Select a section to answer</p>
            </div>
            <div className="space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.type)}
                  className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                    activeSection === s.type ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.title}</span>
                    {done[s.type] && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className={`text-xs mt-1 ${activeSection === s.type ? "text-gray-300" : "text-gray-500"}`}>{s.type}</div>
                </button>
              ))}
            </div>

            {/* Submit button */}
            <div className="pt-4 mt-4 border-t">
              <button
                onClick={submitAttempt}
                disabled={submitting}
                className="w-full px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Attempt"}
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900">{active.title} ({active.type})</h1>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{active.durationMin} min</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm rounded-md bg-white border border-gray-200 hover:bg-gray-50"
                onClick={() => saveSection(active.type)}
                disabled={saving === active.type}
              >
                {saving === active.type ? "Saving..." : "Save Draft"}
              </button>
              <button
                className="px-3 py-1.5 text-sm rounded-md bg-gray-900 text-white hover:bg-gray-800"
                onClick={() => markDone(active.type)}
              >
                Mark as Done
              </button>
            </div>
          </div>

          {/* Passages / transcript */}
          {active.questions.some((q) => q.prompt?.passage) && (
            <div className="mb-4 p-3 bg-gray-50 rounded border text-sm text-gray-700 whitespace-pre-wrap">
              {active.questions.find((q) => q.prompt?.passage)?.prompt?.passage}
            </div>
          )}
          {active.questions.some((q) => q.prompt?.transcript) && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-800 whitespace-pre-wrap">
              {active.questions.find((q) => q.prompt?.transcript)?.prompt?.transcript}
            </div>
          )}

          <div className="space-y-4">
            {active.questions.map((q) => (
              <QuestionBlock
                key={q.id}
                sectionType={active.type}
                q={q}
                value={(answers[active.type] || {})[q.id]}
                onChange={(val) => setAnswer(active.type, q.id, val)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function QuestionBlock({ sectionType, q, value, onChange }: { sectionType: string; q: any; value: any; onChange: (v: any) => void }) {
  const qtype = q.qtype as string;
  return (
    <div className="border border-gray-100 rounded p-4">
      <div className="text-sm text-gray-900 font-medium mb-2">Q{q.order}. {q.prompt?.text || "Question"}</div>
      {renderInputByType(qtype, q, value, onChange)}
    </div>
  );
}

function renderInputByType(qtype: string, q: any, value: any, onChange: (v: any) => void) {
  switch (qtype) {
    case "MCQ": {
      const variants = q.options?.variants || [];
      return (
        <div className="space-y-2">
          {variants.map((opt: any) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm text-gray-800">
              <input
                type="radio"
                name={q.id}
                checked={value === opt.id}
                onChange={() => onChange(opt.id)}
                className="h-4 w-4"
              />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
      );
    }
    case "TF": {
      return (
        <div className="flex items-center gap-4 text-sm text-gray-800">
          <label className="flex items-center gap-2">
            <input type="radio" name={q.id} checked={value === true} onChange={() => onChange(true)} className="h-4 w-4" /> True
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name={q.id} checked={value === false} onChange={() => onChange(false)} className="h-4 w-4" /> False
          </label>
        </div>
      );
    }
    case "GAP": {
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
          placeholder="Type your answer"
        />
      );
    }
    case "SHORT_TEXT": {
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400"
          placeholder="Write a short answer"
        />
      );
    }
    case "ESSAY": {
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-gray-400 min-h-[120px]"
          placeholder="Write your essay here"
        />
      );
    }
    case "ORDER": {
      const items = useMemo(() => (value && Array.isArray(value) ? value : (q.options?.items || []).map((it: any) => it.id)), [value, q.options]);
      const labels: Record<string, string> = {};
      (q.options?.items || []).forEach((it: any) => (labels[it.id] = it.text));
      const move = (idx: number, dir: -1 | 1) => {
        const next = items.slice();
        const j = idx + dir;
        if (j < 0 || j >= next.length) return;
        const tmp = next[idx];
        next[idx] = next[j];
        next[j] = tmp;
        onChange(next);
      };
      return (
        <div className="space-y-2">
          {items.map((id: string, idx: number) => (
            <div key={id} className="flex items-center justify-between bg-gray-50 border rounded px-2 py-1 text-sm">
              <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-gray-200" />{labels[id] || id}</div>
              <div className="flex items-center gap-1">
                <button type="button" className="px-2 py-0.5 text-xs border rounded" onClick={() => move(idx, -1)}>Up</button>
                <button type="button" className="px-2 py-0.5 text-xs border rounded" onClick={() => move(idx, +1)}>Down</button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    case "DND_MATCH": {
      const pairs = q.options?.pairs || [];
      const rights = pairs.map((p: any) => p.right);
      const current: Record<string, string> = value || {};
      const onSelect = (left: string, right: string) => {
        onChange({ ...current, [left]: right });
      };
      return (
        <div className="space-y-2">
          {pairs.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 text-sm">
              <div className="min-w-[140px]">{p.left}</div>
              <select
                className="px-2 py-1 border border-gray-200 rounded"
                value={current[p.left] || ""}
                onChange={(e) => onSelect(p.left, e.target.value)}
              >
                <option value="" disabled>Select match…</option>
                {rights.map((r: string) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }
    default:
      return <div className="text-xs text-gray-500">Unsupported question type: {qtype}</div>;
  }
}

