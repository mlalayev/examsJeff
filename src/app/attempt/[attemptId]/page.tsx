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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  const sections = data.exam.sections;
  const active = sections.find((s) => s.type === activeSection) || sections[0];
  const progress = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{data.exam.title}</h1>
                <p className="text-sm text-slate-500">{data.exam.category}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-mono font-medium text-slate-900">
                  {timeLeft ? formatTime(timeLeft) : "0:00"}
                </span>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 hover:bg-slate-200 rounded transition"
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>
              
              {/* Progress */}
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-slate-600 font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 sticky top-24 shadow-lg">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Exam Sections</h2>
              <p className="text-sm text-slate-500">
                Complete all sections to finish your exam
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.type)}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    activeSection === s.type
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-lg"
                      : "bg-white/50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{s.title}</span>
                    {done[s.type] && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={activeSection === s.type ? "text-blue-100" : "text-slate-500"}>
                      {s.type}
                    </span>
                    <span className={activeSection === s.type ? "text-blue-100" : "text-slate-500"}>
                      {s.durationMin} min
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => manualSave(active.type)}
                disabled={saving === active.type}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {saving === active.type ? "Saving..." : "Save Draft"}
              </button>
              
              <button
                onClick={() => markDone(active.type)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                <Check className="w-4 h-4" />
                Mark as Done
              </button>
              
              <button
                onClick={submitAttempt}
                disabled={submitting}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 transition font-medium"
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            </div>
            
            {lastSaved && (
              <div className="mt-4 text-center">
                <span className="text-xs text-slate-400">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 lg:col-span-8">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-8 shadow-lg">
            {/* Section Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    {active.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {active.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {active.durationMin} minutes
                    </span>
                    <span>{active.questions.length} questions</span>
                  </div>
                </div>
                {done[active.type] && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </div>
                )}
              </div>
            </div>

            {/* Passages / transcript */}
            {active.questions.some((q) => q.prompt?.passage) && (
              <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Reading Passage</h3>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {active.questions.find((q) => q.prompt?.passage)?.prompt?.passage}
                </div>
              </div>
            )}
            
            {active.questions.some((q) => q.prompt?.transcript) && (
              <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">Listening Transcript</h3>
                <div className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                  {active.questions.find((q) => q.prompt?.transcript)?.prompt?.transcript}
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-6">
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
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {q.order}
        </div>
        <div className="flex-1">
          <div className="text-slate-900 font-medium mb-2 leading-relaxed">
            {q.prompt?.text || "Question"}
          </div>
          {q.maxScore && (
            <div className="text-xs text-slate-500">
              {q.maxScore} point{q.maxScore !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
      <div className="ml-12">
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
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          placeholder="Write a short answer"
        />
      );
    case "ESSAY":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition min-h-[120px] resize-y"
          placeholder="Write your essay here"
        />
      );
    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Unsupported question type:</strong> {qtype}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Please contact support if you believe this is an error.
          </div>
        </div>
      );
  }
}

