"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Clock, CheckCircle2, Save, Check, ArrowLeft, Play, Pause } from "lucide-react";
import {
  QTF,
  QMcqSingle,
  QMcqMulti,
  QSelect,
  QGap,
  QOrderSentence,
  QDndGap,
} from "@/components/questions";

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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
      
      // Initialize timer with total duration
      const totalDuration = json.exam.sections.reduce((acc: number, s: any) => acc + s.durationMin, 0);
      setTimeLeft(totalDuration * 60); // Convert to seconds
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            setIsTimerRunning(false);
            // Auto submit when time runs out
            submitAttempt();
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Autosave with debounce
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveSection = useCallback(
    async (sectionType: string, answersToSave: Record<string, any>) => {
      setSaving(sectionType);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType,
            answers: answersToSave,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to save");
        setLastSaved(new Date());
      } catch (e) {
        console.error(e);
        // Silently fail for autosave, only alert on manual save
      } finally {
        setSaving(null);
      }
    },
    [attemptId]
  );

  const setAnswer = (sectionType: string, questionId: string, value: any) => {
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [sectionType]: { ...(prev[sectionType] || {}), [questionId]: value },
      };

      // Trigger autosave with debounce (8 seconds)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        saveSection(sectionType, newAnswers[sectionType]);
      }, 8000);

      return newAnswers;
    });
  };

  const manualSave = async (sectionType: string) => {
    // Clear autosave timer and save immediately
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    await saveSection(sectionType, answers[sectionType] || {});
  };

  const markDone = (sectionType: string) => {
    setDone((prev) => ({ ...prev, [sectionType]: true }));
  };

  const submitAttempt = async () => {
    if (!data) return;
    if (!confirm("Are you sure you want to submit? You won't be able to change your answers after submission.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submit failed");
      // Redirect to results page
      router.push(`/attempt/${attemptId}/results`);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!data) return 0;
    const totalSections = data.exam.sections.length;
    const completedSections = Object.values(done).filter(Boolean).length;
    return (completedSections / totalSections) * 100;
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  const sections = data.exam.sections;
  const active = sections.find((s) => s.type === activeSection) || sections[0];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div>
                <h1 className="text-lg font-medium text-gray-900">{data.exam.title}</h1>
                <p className="text-sm text-gray-500">{data.exam.category}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-mono text-gray-900">
                  {timeLeft ? formatTime(timeLeft) : "0:00"}
                </span>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
              
              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 bg-gray-200 rounded overflow-hidden">
                  <div 
                    className="h-full bg-gray-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="bg-white border border-gray-200 rounded p-4 sticky top-24">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Sections</h2>
              <p className="text-sm text-gray-500">
                Complete all sections
              </p>
            </div>
            
            <div className="space-y-2 mb-4">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.type)}
                  className={`w-full text-left p-3 rounded border ${
                    activeSection === s.type
                      ? "bg-slate-100 text-slate-800 border-slate-300"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.title}</span>
                    {done[s.type] && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {s.type} • {s.durationMin} min
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => manualSave(active.type)}
                disabled={saving === active.type}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded hover:bg-slate-100 disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                {saving === active.type ? "Saving..." : "Save"}
              </button>
              
              <button
                onClick={() => markDone(active.type)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
              >
                <Check className="w-4 h-4" />
                Mark Done
              </button>
              
              <button
                onClick={submitAttempt}
                disabled={submitting}
                className="w-full px-3 py-2 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            
            {lastSaved && (
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-400">
                  Saved: {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-gray-200 rounded p-6">
            {/* Section Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-medium text-gray-900 mb-1">
                    {active.title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{active.type}</span>
                    <span>•</span>
                    <span>{active.durationMin} min</span>
                    <span>•</span>
                    <span>{active.questions.length} questions</span>
                  </div>
                </div>
                {done[active.type] && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                  </div>
                )}
              </div>
            </div>

            {/* Passages / transcript */}
            {active.questions.some((q) => q.prompt?.passage) && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reading Passage</h3>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {active.questions.find((q) => q.prompt?.passage)?.prompt?.passage}
                </div>
              </div>
            )}
            
            {active.questions.some((q) => q.prompt?.transcript) && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Listening Transcript</h3>
                <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                  {active.questions.find((q) => q.prompt?.transcript)?.prompt?.transcript}
                </div>
              </div>
            )}

            {/* Questions */}
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
          </div>
        </main>
      </div>
    </div>
  );
}

function QuestionBlock({
  sectionType,
  q,
  value,
  onChange,
}: {
  sectionType: string;
  q: any;
  value: any;
  onChange: (v: any) => void;
}) {
  const qtype = q.qtype as string;
  
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-6 h-6 bg-slate-200 text-slate-700 rounded flex items-center justify-center text-sm font-medium">
          {q.order}
        </div>
        <div className="flex-1">
          <div className="text-gray-900 font-medium mb-1 leading-relaxed">
            {q.prompt?.text || "Question"}
          </div>
          {q.maxScore && (
            <div className="text-xs text-gray-500">
              {q.maxScore} point{q.maxScore !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      <div className="ml-9">
        {renderQuestionComponent(qtype, q, value, onChange)}
      </div>
    </div>
  );
}

function renderQuestionComponent(
  qtype: string,
  q: any,
  value: any,
  onChange: (v: any) => void
) {
  const props = { question: q, value, onChange, readOnly: false };

  switch (qtype) {
    case "TF":
      return <QTF {...props} />;
    case "MCQ_SINGLE":
      return <QMcqSingle {...props} />;
    case "MCQ_MULTI":
      return <QMcqMulti {...props} />;
    case "SELECT":
      return <QSelect {...props} />;
    case "GAP":
      return <QGap {...props} />;
    case "ORDER_SENTENCE":
      return <QOrderSentence {...props} />;
    case "DND_GAP":
      return <QDndGap {...props} />;
    case "SHORT_TEXT":
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
          placeholder="Write a short answer"
        />
      );
    case "ESSAY":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100 min-h-[120px] resize-y"
          placeholder="Write your essay here"
        />
      );
    default:
      return (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            <strong>Unsupported question type:</strong> {qtype}
          </div>
        </div>
      );
  }
}

