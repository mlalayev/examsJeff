"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";
import { 
  ArrowLeft, 
  Users, 
  FileText, 
  Award,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3
} from "lucide-react";

interface AnalyticsData {
  class: {
    id: string;
    name: string;
    teacher: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  studentsCount: number;
  attemptsCount: number;
  avgOverall: number | null;
  avgBySection: {
    READING: number | null;
    LISTENING: number | null;
    WRITING: number | null;
    SPEAKING: number | null;
  };
  trendLastN: Array<{
    weekStart: string;
    avgOverall: number;
  }>;
  weakTopics: Array<{
    tag: string;
    accuracyPercent: number;
    attempts: number;
  }>;
}

export default function ClassAnalyticsPage({ params }: { params: { classId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session, params.classId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/teacher/overview?classId=${params.classId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch analytics");
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getBandColor = (band: number | null) => {
    if (band === null) return "text-gray-600";
    if (band >= 8) return "text-green-600";
    if (band >= 7) return "text-blue-600";
    if (band >= 6) return "text-purple-600";
    if (band >= 5) return "text-orange-600";
    return "text-red-600";
  };

  const getAccuracyColor = (percent: number) => {
    if (percent >= 80) return "bg-green-100 text-green-800";
    if (percent >= 60) return "bg-blue-100 text-blue-800";
    if (percent >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <UnifiedLoading type="fullpage" variant="spinner" size="lg" fullScreen />
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-medium">{error || "Failed to load analytics"}</p>
          <button
            onClick={() => router.push("/dashboard/teacher")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasData = data.attemptsCount > 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/teacher")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Analytics</h1>
        <p className="text-gray-600">{data.class.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Students</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.studentsCount}</p>
          <p className="text-sm text-gray-500 mt-1">Enrolled</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Attempts</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.attemptsCount}</p>
          <p className="text-sm text-gray-500 mt-1">Completed</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Avg Overall</h3>
          </div>
          <p className={`text-3xl font-bold ${getBandColor(data.avgOverall)}`}>
            {data.avgOverall?.toFixed(1) || "—"}
          </p>
          <p className="text-sm text-gray-500 mt-1">Band score</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Data Points</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.trendLastN.length}</p>
          <p className="text-sm text-gray-500 mt-1">Weeks tracked</p>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Not enough data</h3>
          <p className="text-gray-600">
            Students need to complete exams before analytics can be generated.
          </p>
        </div>
      ) : (
        <>
          {/* Performance Trend */}
          {data.trendLastN.length > 0 && (
            <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Performance Trend (Last 8 Weeks)</h2>
                {data.trendLastN.length >= 2 && (
                  <div className="flex items-center gap-2">
                    {data.trendLastN[data.trendLastN.length - 1].avgOverall > 
                     data.trendLastN[0].avgOverall ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Improving</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Declining</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Simple Line Chart (SVG) */}
              <div className="relative h-64">
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="0" y1="200" x2="800" y2="200" stroke="#e5e7eb" strokeWidth="1" />

                  {/* Data line */}
                  {data.trendLastN.length > 1 && (
                    <polyline
                      points={data.trendLastN
                        .map((point, i) => {
                          const x = (i / (data.trendLastN.length - 1)) * 800;
                          const y = 200 - ((point.avgOverall / 9) * 200);
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data points */}
                  {data.trendLastN.map((point, i) => {
                    const x = (i / Math.max(data.trendLastN.length - 1, 1)) * 800;
                    const y = 200 - ((point.avgOverall / 9) * 200);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
                  <span>9.0</span>
                  <span>6.75</span>
                  <span>4.5</span>
                  <span>2.25</span>
                  <span>0.0</span>
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                {data.trendLastN.map((point, i) => (
                  <span key={i}>
                    {new Date(point.weekStart).toLocaleDateString("en-US", { 
                      month: "short", 
                      day: "numeric" 
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section Performance */}
          <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Performance by Section</h2>
            <div className="space-y-4">
              {Object.entries(data.avgBySection).map(([section, band]) => (
                <div key={section}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{section}</span>
                    <span className={`font-bold ${getBandColor(band)}`}>
                      {band?.toFixed(1) || "—"}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        band === null ? "bg-gray-300" :
                        band >= 8 ? "bg-green-500" :
                        band >= 7 ? "bg-blue-500" :
                        band >= 6 ? "bg-purple-500" :
                        band >= 5 ? "bg-orange-500" :
                        "bg-red-500"
                      } transition-all duration-500`}
                      style={{ width: band !== null ? `${(band / 9) * 100}%` : "10%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics */}
          {data.weakTopics.length > 0 && (
            <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-900">Areas for Improvement</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Topics where students are struggling most (sorted by accuracy)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Topic
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Attempts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.weakTopics.map((topic, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">{topic.tag}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-lg font-bold text-gray-900">
                            {topic.accuracyPercent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600">{topic.attempts}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAccuracyColor(topic.accuracyPercent)}`}>
                            {topic.accuracyPercent >= 80 ? "Strong" :
                             topic.accuracyPercent >= 60 ? "Good" :
                             topic.accuracyPercent >= 40 ? "Weak" : "Critical"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.weakTopics.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-800">
                No topic data available. Tag questions with topics to see weak areas analysis.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

