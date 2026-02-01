"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, User, Calendar, FileText, Save, Eye, EyeOff } from "lucide-react";

interface WritingSubmission {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
  };
  task1Response: string;
  task2Response: string;
  wordCountTask1: number;
  wordCountTask2: number;
  submittedAt: string;
  timeSpentSeconds: number;
  overallBand?: number | null;
  task1Band?: number | null;
  task2Band?: number | null;
  overallComments?: string | null;
  task1Comments?: string | null;
  task2Comments?: string | null;
  feedbackPublished: boolean;
  gradedAt?: string | null;
  gradedBy?: {
    id: string;
    name: string;
  } | null;
}

export default function WritingSubmissionReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [submission, setSubmission] = useState<WritingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Feedback state
  const [overallBand, setOverallBand] = useState<number | null>(null);
  const [task1Band, setTask1Band] = useState<number | null>(null);
  const [task2Band, setTask2Band] = useState<number | null>(null);
  const [overallComments, setOverallComments] = useState("");
  const [task1Comments, setTask1Comments] = useState("");
  const [task2Comments, setTask2Comments] = useState("");
  const [feedbackPublished, setFeedbackPublished] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [params.id]);

  const fetchSubmission = async () => {
    try {
      const res = await fetch(`/api/writing-submissions/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const sub = data.submission;
        setSubmission(sub);
        
        // Load existing feedback
        setOverallBand(sub.overallBand);
        setTask1Band(sub.task1Band);
        setTask2Band(sub.task2Band);
        setOverallComments(sub.overallComments || "");
        setTask1Comments(sub.task1Comments || "");
        setTask2Comments(sub.task2Comments || "");
        setFeedbackPublished(sub.feedbackPublished);
      } else {
        alert("Failed to load submission");
        router.back();
      }
    } catch (error) {
      console.error("Failed to load submission:", error);
      alert("Failed to load submission");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const saveFeedback = async (publish = false) => {
    if (!submission) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/writing-submissions/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallBand,
          task1Band,
          task2Band,
          overallComments,
          task1Comments,
          task2Comments,
          feedbackPublished: publish ? true : feedbackPublished,
        }),
      });

      if (res.ok) {
        alert(publish ? "Feedback published successfully!" : "Feedback saved successfully!");
        if (publish) {
          setFeedbackPublished(true);
        }
        fetchSubmission(); // Refresh
      } else {
        const error = await res.json();
        alert(`Failed to save feedback: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to save feedback:", error);
      alert("Failed to save feedback");
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="p-8">
        <p>Submission not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">IELTS Writing Review</h1>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Student</p>
                <p className="font-medium">{submission.student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Time Spent</p>
                <p className="font-medium">{formatTime(submission.timeSpentSeconds)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {feedbackPublished ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-medium ${feedbackPublished ? "text-green-600" : "text-gray-600"}`}>
                  {feedbackPublished ? "Published" : "Draft"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Writing Responses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task 1 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Task 1</h2>
                <span className="text-sm text-gray-600">
                  {submission.wordCountTask1} words
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {submission.task1Response}
                  </p>
                </div>
              </div>
            </div>

            {/* Task 2 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Task 2</h2>
                <span className="text-sm text-gray-600">
                  {submission.wordCountTask2} words
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {submission.task2Response}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Panel */}
          <div className="space-y-6">
            {/* Band Scores */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Band Scores</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Band
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={overallBand || ""}
                    onChange={(e) => setOverallBand(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="0-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task 1 Band
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={task1Band || ""}
                    onChange={(e) => setTask1Band(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="0-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task 2 Band
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={task2Band || ""}
                    onChange={(e) => setTask2Band(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="0-9"
                  />
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Comments</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Comments
                  </label>
                  <textarea
                    value={overallComments}
                    onChange={(e) => setOverallComments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="General feedback..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task 1 Comments
                  </label>
                  <textarea
                    value={task1Comments}
                    onChange={(e) => setTask1Comments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Task 1 specific feedback..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task 2 Comments
                  </label>
                  <textarea
                    value={task2Comments}
                    onChange={(e) => setTask2Comments(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Task 2 specific feedback..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-3">
                <button
                  onClick={() => saveFeedback(false)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                
                <button
                  onClick={() => saveFeedback(true)}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Publishing..." : "Publish Feedback"}
                </button>

                {submission.gradedAt && submission.gradedBy && (
                  <div className="text-xs text-gray-500 text-center pt-2">
                    Last graded by {submission.gradedBy.name} on{" "}
                    {new Date(submission.gradedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

