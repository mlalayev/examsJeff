"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

interface ResultQuestion {
  id: string;
  order: number;
  qtype: string;
  prompt: any;
  options?: any;
  yourAnswer: any;
  correctAnswer: any;
  explanation?: any;
  maxScore: number;
}

interface ResultSection {
  id: string;
  type: string;
  title: string;
  rawScore: number | null;
  maxScore: number | null;
  percent: number | null;
  questions: ResultQuestion[];
}

interface ResultsData {
  attempt: { id: string; status: string; submittedAt: string | null; bandOverall: number | null };
  exam: { id: string; title: string; category: string; track?: string | null };
  sections: ResultSection[];
}

export default function AttemptResultsPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResultsData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/attempts/${attemptId}/results`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load results");
        setData(json);
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load results");
        router.push(`/attempt/${attemptId}`);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  const autoSections = data.sections.filter((s) => s.type !== "WRITING");
  const totalRaw = autoSections.reduce((acc, s) => acc + (s.rawScore || 0), 0);
  const totalMax = autoSections.reduce((acc, s) => acc + (s.maxScore || 0), 0);
  const overall = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Exam Results</h1>
        <p className="text-lg text-gray-700 font-medium">{data.exam.title}</p>
        <p className="text-sm text-gray-500">{data.exam.category} {data.exam.track ? `· ${data.exam.track}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="text-xs text-emerald-700 font-medium uppercase">Overall Score</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">{overall !== null ? `${overall}%` : "—"}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <div className="text-xs text-gray-500 font-medium uppercase">Total Points</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalRaw} / {totalMax}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <div className="text-xs text-gray-500 font-medium uppercase">Submitted</div>
          <div className="text-sm text-gray-700 mt-1">{data.attempt.submittedAt ? new Date(data.attempt.submittedAt).toLocaleString() : "—"}</div>
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <div className="text-xs text-gray-500 font-medium uppercase">Status</div>
          <div className="text-sm font-medium text-gray-900 mt-1">{data.attempt.status}</div>
        </div>
      </div>

      <div className="space-y-6">
        {data.sections.map((sec) => (
          <div key={sec.id} className="border rounded bg-white">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">{sec.type}</div>
                <div className="text-lg font-semibold text-gray-900">{sec.title}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-900 font-medium">
                  {sec.rawScore ?? 0} / {sec.maxScore ?? 0}
                </div>
                {sec.percent !== null && (
                  <div className={`text-xs font-medium ${sec.percent >= 70 ? 'text-emerald-600' : sec.percent >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {sec.percent}%
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {sec.questions.map((q) => {
                const isAuto = q.qtype !== "SHORT_TEXT" && q.qtype !== "ESSAY";
                const isCorrect = isAuto && checkCorrect(q.qtype, q.yourAnswer, q.correctAnswer);
                return (
                  <div key={q.id} className={`border rounded-lg p-4 ${isAuto ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Q{q.order}. {q.prompt?.text || "Question"}
                        </div>
                        {q.prompt?.passage && (
                          <div className="text-xs text-gray-600 bg-white p-2 rounded border mt-2 mb-2">
                            <span className="font-medium">Passage:</span> {q.prompt.passage}
                          </div>
                        )}
                        {q.prompt?.transcript && (
                          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mt-2 mb-2">
                            <span className="font-medium">Transcript:</span> {q.prompt.transcript}
                          </div>
                        )}
                      </div>
                      {isAuto && (
                        <div className="ml-3">
                          {isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-rose-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">Your answer:</span>{" "}
                        <span className={isAuto ? (isCorrect ? 'text-emerald-700' : 'text-rose-700') : 'text-gray-700'}>
                          {formatAnswer(q.qtype, q.yourAnswer, q.options, q.prompt)}
                        </span>
                      </div>
                      {isAuto && (
                        <div className="text-sm">
                          <span className="font-semibold text-gray-700">Correct answer:</span>{" "}
                          <span className="text-emerald-700">
                            {formatAnswer(q.qtype, q.correctAnswer, q.options, q.prompt)}
                          </span>
                        </div>
                      )}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                        <span className="font-medium">💡 Explanation:</span> {renderExplanation(q.explanation)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function checkCorrect(qtype: string, yourAnswer: any, correctAnswer: any): boolean {
  if (correctAnswer == null) return false;
  
  switch (qtype) {
    case "TF":
      return yourAnswer === correctAnswer?.value;
    case "MCQ_SINGLE":
    case "SELECT":
      return yourAnswer === correctAnswer?.index;
    case "MCQ_MULTI": {
      const correctIndices = correctAnswer?.indices || [];
      if (!Array.isArray(yourAnswer)) return false;
      const sorted = [...yourAnswer].sort((a, b) => a - b);
      const correctSorted = [...correctIndices].sort((a, b) => a - b);
      if (sorted.length !== correctSorted.length) return false;
      return sorted.every((v, i) => v === correctSorted[i]);
    }
    case "GAP": {
      const acceptedAnswers = correctAnswer?.answers || [];
      if (typeof yourAnswer !== "string") return false;
      const normalized = yourAnswer.trim().toLowerCase();
      return acceptedAnswers.some((a: string) => {
        if (typeof a !== "string") return false;
        return a.trim().toLowerCase() === normalized;
      });
    }
    case "ORDER_SENTENCE": {
      const correctOrder = correctAnswer?.order || [];
      if (!Array.isArray(yourAnswer)) return false;
      if (yourAnswer.length !== correctOrder.length) return false;
      return yourAnswer.every((v, i) => v === correctOrder[i]);
    }
    case "DND_GAP": {
      const correctBlanks = correctAnswer?.blanks || [];
      if (!Array.isArray(yourAnswer)) return false;
      if (yourAnswer.length !== correctBlanks.length) return false;
      return yourAnswer.every((v, i) => {
        if (typeof v !== "string" || typeof correctBlanks[i] !== "string") return false;
        return v.trim().toLowerCase() === correctBlanks[i].trim().toLowerCase();
      });
    }
    default:
      return false;
  }
}

function formatAnswer(qtype: string, answer: any, options: any, prompt: any): string {
  if (answer == null || answer === undefined) return "—";
  
  switch (qtype) {
    case "TF":
      if (answer === true) return "True";
      if (answer === false) return "False";
      if (typeof answer === "object" && answer.value !== undefined) {
        return answer.value ? "True" : "False";
      }
      return "—";
      
    case "MCQ_SINGLE":
    case "SELECT": {
      const choices = options?.choices || [];
      const idx = typeof answer === "object" && answer.index !== undefined ? answer.index : answer;
      if (typeof idx === "number" && choices[idx]) {
        return choices[idx];
      }
      return `Option ${idx + 1}`;
    }
    
    case "MCQ_MULTI": {
      const choices = options?.choices || [];
      const indices = typeof answer === "object" && answer.indices ? answer.indices : (Array.isArray(answer) ? answer : []);
      if (Array.isArray(indices) && indices.length > 0) {
        return indices
          .sort((a: number, b: number) => a - b)
          .map((idx: number) => choices[idx] || `Option ${idx + 1}`)
          .join(", ");
      }
      return "—";
    }
    
    case "GAP": {
      if (typeof answer === "object" && answer.answers) {
        return answer.answers.join(" | ");
      }
      return String(answer);
    }
    
    case "ORDER_SENTENCE": {
      const tokens = prompt?.tokens || [];
      let order: number[];
      if (typeof answer === "object" && answer.order) {
        order = answer.order;
      } else if (Array.isArray(answer)) {
        order = answer;
      } else {
        return String(answer);
      }
      
      if (Array.isArray(order) && tokens.length > 0) {
        return order.map((idx: number) => tokens[idx]).join(" ");
      }
      return order.join(" → ");
    }
    
    case "DND_GAP": {
      let blanks: string[];
      if (typeof answer === "object" && answer.blanks) {
        blanks = answer.blanks;
      } else if (Array.isArray(answer)) {
        blanks = answer;
      } else {
        return String(answer);
      }
      
      return blanks.join(" | ");
    }
    
    case "SHORT_TEXT":
    case "ESSAY":
      return String(answer);
      
    default:
      return String(answer);
  }
}

function renderExplanation(ex: any): string {
  if (typeof ex === "string") return ex;
  if (ex && typeof ex.text === "string") return ex.text;
  try { return JSON.stringify(ex); } catch { return String(ex); }
}
