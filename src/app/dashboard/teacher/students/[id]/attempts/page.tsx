"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, Award, CheckCircle, XCircle, Clock } from "lucide-react";

interface Attempt {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  overallPercent: number | null;
  exam: {
    id: string;
    title: string;
    category: string;
  } | null;
  sections: {
    type: string;
    rawScore: number | null;
    maxScore: number | null;
  }[];
}

interface Student {
  id: string;
  name: string | null;
  email: string;
}

export default function StudentAttemptsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch student info and attempts
      const [studentRes, attemptsRes] = await Promise.all([
        fetch(`/api/teacher/students/${studentId}`),
        fetch(`/api/teacher/students/${studentId}/attempts`),
      ]);

      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudent(studentData.student);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setAttempts(attemptsData.attempts || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Submitted
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      IELTS: "bg-blue-100 text-blue-800",
      TOEFL: "bg-purple-100 text-purple-800",
      SAT: "bg-orange-100 text-orange-800",
      GENERAL_ENGLISH: "bg-green-100 text-green-800",
      MATH: "bg-red-100 text-red-800",
      KIDS: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Class
        </button>
        
        {student && (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-600 font-medium text-lg">
                {(student.name || student.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-medium text-gray-900">
                {student.name || "Student"}
              </h1>
              <p className="text-gray-500 text-sm">{student.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-md p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-400 rounded w-1/3"></div>
                <div className="h-4 bg-gray-400 rounded w-1/2"></div>
                <div className="h-4 bg-gray-400 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attempts</h3>
          <p className="text-gray-600">This student hasn't attempted any exams yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {attempt.exam && (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getCategoryColor(attempt.exam.category)}`}>
                          {attempt.exam.category}
                        </span>
                      )}
                      {getStatusBadge(attempt.status)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {attempt.exam?.title || "Unknown Exam"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(attempt.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {attempt.overallPercent !== null && (
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">Score</div>
                      <div className={`text-3xl font-medium ${
                        attempt.overallPercent >= 75 ? "text-green-600" :
                        attempt.overallPercent >= 50 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {attempt.overallPercent}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Section Scores */}
                {attempt.sections && attempt.sections.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4 pt-4 border-t border-gray-200">
                    {attempt.sections.map((section, idx) => (
                      <div key={idx} className="text-center p-3 bg-gray-50 rounded-md">
                        <div className="text-xs text-gray-500 mb-1">{section.type}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {section.rawScore ?? "—"} / {section.maxScore ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* View Results Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/attempts/${attempt.id}/results`)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors text-sm font-medium"
                    style={{ backgroundColor: "#303380" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#252a6b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#303380";
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    View Detailed Results
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

