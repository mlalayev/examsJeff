"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, User, FileText, Calendar, Loader2, CheckCircle } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface SectionData {
  section: {
    id: string;
    type: string;
    answers: any;
    bandScore: number | null;
    rubric: any;
    feedback: string | null;
    gradedById: string | null;
    startedAt: string | null;
    endedAt: string | null;
    status: string;
  };
  attempt: {
    id: string;
    status: string;
    submittedAt: string | null;
    bandOverall: number | null;
  };
  student: {
    id: string;
    name: string | null;
    email: string;
  };
  exam: {
    id: string;
    title: string;
    examType: string;
  };
}

export default function GradeSectionPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [bandScore, setBandScore] = useState<number>(5.0);
  const [feedback, setFeedback] = useState("");
  
  // IELTS Rubric fields (optional)
  const [taskAchievement, setTaskAchievement] = useState<number>(5.0);
  const [coherenceCohesion, setCoherenceCohesion] = useState<number>(5.0);
  const [lexicalResource, setLexicalResource] = useState<number>(5.0);
  const [grammaticalRange, setGrammaticalRange] = useState<number>(5.0);

  useEffect(() => {
    if (session) {
      fetchSection();
    }
  }, [session, params.id]);

  const fetchSection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attempt-sections/${params.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch section");
      }
      const sectionData = await response.json();
      setData(sectionData);
      
      // Pre-fill if already graded
      if (sectionData.section.bandScore !== null) {
        setBandScore(sectionData.section.bandScore);
        setFeedback(sectionData.section.feedback || "");
        
        if (sectionData.section.rubric) {
          const rubric = sectionData.section.rubric;
          setTaskAchievement(rubric.taskAchievement || 5.0);
          setCoherenceCohesion(rubric.coherenceCohesion || 5.0);
          setLexicalResource(rubric.lexicalResource || 5.0);
          setGrammaticalRange(rubric.grammaticalRange || 5.0);
        }
      }
    } catch (err) {
      console.error("Error fetching section:", err);
      setError(err instanceof Error ? err.message : "Failed to load section");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Validate band score
    if (bandScore < 0 || bandScore > 9) {
      setError("Band score must be between 0 and 9");
      return;
    }
    
    if (bandScore % 0.5 !== 0) {
      setError("Band score must be in 0.5 steps (e.g., 6.0, 6.5, 7.0)");
      return;
    }

    try {
      setSubmitting(true);
      
      const rubric = data?.section.type === "WRITING" ? {
        taskAchievement,
        coherenceCohesion,
        lexicalResource,
        grammaticalRange,
      } : undefined;

      const response = await fetch(`/api/attempt-sections/${params.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandScore,
          rubric,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit grade");
      }

      const result = await response.json();
      setSuccess(true);
      
      // Redirect back to queue after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/teacher/grading");
      }, 2000);
      
    } catch (err) {
      console.error("Error submitting grade:", err);
      setError(err instanceof Error ? err.message : "Failed to submit grade");
    } finally {
      setSubmitting(false);
    }
  };

  const bandOptions = [];
  for (let i = 0; i <= 9; i += 0.5) {
    bandOptions.push(i);
  }

  if (loading) {
    return (
      <UnifiedLoading type="fullpage" variant="spinner" size="lg" fullScreen />
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => router.push("/dashboard/teacher/grading")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/teacher/grading")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Queue
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Grade {data.section.type} Section
        </h1>
      </div>

      {/* Student & Exam Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Student</p>
              <p className="font-semibold text-gray-900">
                {data.student.name || data.student.email}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Exam</p>
              <p className="font-semibold text-gray-900">{data.exam.title}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="font-semibold text-gray-900">
                {data.attempt.submittedAt
                  ? new Date(data.attempt.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student's Answer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Student's Response</h2>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {data.section.answers ? (
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
              {typeof data.section.answers === "string"
                ? data.section.answers
                : JSON.stringify(data.section.answers, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500 italic">No response submitted</p>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Grade submitted successfully!</p>
            <p className="text-green-700 text-sm">Redirecting back to queue...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Grading Form */}
      <form onSubmit={handleSubmitGrade} className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Grade Section</h2>

        {/* Band Score */}
        <div className="mb-6">
          <label htmlFor="bandScore" className="block text-sm font-medium text-gray-700 mb-2">
            Band Score (0-9, 0.5 steps) *
          </label>
          <select
            id="bandScore"
            required
            value={bandScore}
            onChange={(e) => setBandScore(parseFloat(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
          >
            {bandOptions.map((score) => (
              <option key={score} value={score}>
                {score.toFixed(1)}
              </option>
            ))}
          </select>
        </div>

        {/* IELTS Writing Rubric (Optional) */}
        {data.section.type === "WRITING" && data.exam.examType === "IELTS" && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">IELTS Writing Rubric (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Achievement
                </label>
                <select
                  value={taskAchievement}
                  onChange={(e) => setTaskAchievement(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {bandOptions.map((score) => (
                    <option key={score} value={score}>
                      {score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coherence & Cohesion
                </label>
                <select
                  value={coherenceCohesion}
                  onChange={(e) => setCoherenceCohesion(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {bandOptions.map((score) => (
                    <option key={score} value={score}>
                      {score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lexical Resource
                </label>
                <select
                  value={lexicalResource}
                  onChange={(e) => setLexicalResource(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {bandOptions.map((score) => (
                    <option key={score} value={score}>
                      {score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grammatical Range & Accuracy
                </label>
                <select
                  value={grammaticalRange}
                  onChange={(e) => setGrammaticalRange(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {bandOptions.map((score) => (
                    <option key={score} value={score}>
                      {score.toFixed(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Average of rubric scores: {((taskAchievement + coherenceCohesion + lexicalResource + grammaticalRange) / 4).toFixed(1)}
            </p>
          </div>
        )}

        {/* Feedback */}
        <div className="mb-6">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            id="feedback"
            rows={8}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide detailed feedback on strengths, weaknesses, and areas for improvement..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={5000}
          />
          <p className="text-xs text-gray-500 mt-1">{feedback.length} / 5000 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/teacher/grading")}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || success}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Submitted
              </>
            ) : (
              "Submit Grade"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

