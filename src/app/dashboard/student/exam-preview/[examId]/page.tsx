"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, FileText, Users, Eye } from "lucide-react";
import UnifiedLoading from "@/components/loading/UnifiedLoading";

interface ExamSection {
  type: string;
  title: string;
  durationMin: number | null;
  questions: Array<{
    id: string;
    qtype: string;
    prompt: any;
  }>;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  category: string;
  track: string | null;
  sections: ExamSection[];
}

export default function ExamPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    const loadExam = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load exam");
        setExam(json);
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Failed to load exam");
        router.push("/dashboard/catalog");
      } finally {
        setLoading(false);
      }
    };
    
    loadExam();
  }, [examId, router]);

  if (loading) {
    return (
      <UnifiedLoading type="fullpage" variant="spinner" size="lg" fullScreen />
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam not found</h2>
          <button
            onClick={() => router.push("/dashboard/catalog")}
            className="text-blue-600 hover:text-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = exam.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  const totalDuration = exam.sections.reduce((sum, sec) => sum + (sec.durationMin || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/catalog")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Preview</h1>
        <p className="text-gray-600">Review exam details and structure</p>
      </div>

      {/* Exam Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{exam.title}</h2>
        {exam.description && (
          <p className="text-gray-600 mb-6">{exam.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            {totalQuestions} questions
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            {totalDuration} minutes
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            {exam.sections.length} sections
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="w-4 h-4" />
            {exam.category} {exam.track ? `· ${exam.track}` : ""}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">Exam Structure</h3>
        
        {exam.sections.map((section, idx) => (
          <div key={section.type} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
                <p className="text-sm text-gray-600">{section.type}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {section.questions.length} questions
                </div>
                {section.durationMin && (
                  <div className="text-sm text-gray-600">
                    {section.durationMin} minutes
                  </div>
                )}
              </div>
            </div>
            
            {/* Question Types Preview */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Question Types:</div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(section.questions.map(q => q.qtype))).map(qtype => {
                  const count = section.questions.filter(q => q.qtype === qtype).length;
                  return (
                    <span
                      key={qtype}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {qtype} ({count})
                    </span>
                  );
                })}
              </div>
            </div>
            
            {/* Sample Question */}
            {section.questions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">Sample Question:</div>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                  {section.questions[0].prompt?.text || "Question preview not available"}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Take This Exam</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Your teacher will assign this exam to you when ready</li>
          <li>• You'll have a specific time limit for each section</li>
          <li>• Your answers are automatically saved as you work</li>
          <li>• You can review your answers before submitting</li>
          <li>• Once submitted, you'll see your results immediately</li>
        </ul>
      </div>
    </div>
  );
}
